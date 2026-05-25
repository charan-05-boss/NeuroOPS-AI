"""
monitor.__main__
================
Runnable entry point:

    python -m monitor                         # single snapshot (summary)
    python -m monitor --full                  # single snapshot (full detail)
    python -m monitor --stream --interval 2   # stream every 2s
    python -m monitor --stream --count 5      # stream 5 snapshots then exit
    python -m monitor --throughput            # measure network throughput
    python -m monitor --watch                 # live dashboard in terminal

Uses only stdlib for the CLI to avoid extra dependencies.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time

from monitor.service import MonitorService
from monitor.formatters import auto_scale_bytes, percent_bar


# ── ANSI helpers ───────────────────────────────────────────────────────────────

_RESET  = "\033[0m"
_BOLD   = "\033[1m"
_DIM    = "\033[2m"
_CYAN   = "\033[36m"
_GREEN  = "\033[32m"
_YELLOW = "\033[33m"
_RED    = "\033[31m"
_BLUE   = "\033[34m"
_MAGENTA = "\033[35m"

def _color_percent(pct: float) -> str:
    """Return the percent value colorised by severity."""
    s = f"{pct:.1f}%"
    if pct >= 90:
        return f"{_RED}{_BOLD}{s}{_RESET}"
    if pct >= 75:
        return f"{_YELLOW}{s}{_RESET}"
    if pct >= 50:
        return f"{_CYAN}{s}{_RESET}"
    return f"{_GREEN}{s}{_RESET}"

def _header(text: str) -> str:
    return f"\n{_BOLD}{_BLUE}{'─' * 50}{_RESET}\n{_BOLD}{_CYAN}  {text}{_RESET}\n{_BOLD}{_BLUE}{'─' * 50}{_RESET}"

def _row(label: str, value: str) -> str:
    return f"  {_DIM}{label:<22}{_RESET}{value}"


# ── Watch dashboard ────────────────────────────────────────────────────────────

def _render_watch(svc: MonitorService) -> None:
    """Render a live terminal dashboard. Clears screen between frames."""
    snap = svc.snapshot()

    sent_val, sent_unit = auto_scale_bytes(snap.network.bytes_sent)
    recv_val, recv_unit = auto_scale_bytes(snap.network.bytes_recv)

    # Clear screen
    os.system("clear" if os.name != "nt" else "cls")

    print(_header("⚡ NeuroOps AI — System Monitor"))

    # CPU
    print(f"\n  {_BOLD}CPU{_RESET}")
    print(_row("Usage", _color_percent(snap.cpu.percent)))
    print(_row("Bar", percent_bar(snap.cpu.percent, width=24)))
    print(_row("Cores (logical/phys)", f"{snap.cpu.logical_cores} / {snap.cpu.physical_cores}"))
    print(_row("Frequency", f"{snap.cpu.frequency_mhz:.0f} MHz"))
    per_core_str = "  ".join(f"C{i}:{v:.0f}%" for i, v in enumerate(snap.cpu.per_core))
    print(_row("Per-core", f"{_DIM}{per_core_str}{_RESET}"))

    # RAM
    print(f"\n  {_BOLD}RAM{_RESET}")
    print(_row("Usage", _color_percent(snap.ram.percent)))
    print(_row("Bar", percent_bar(snap.ram.percent, width=24)))
    print(_row("Used / Total", f"{snap.ram.used_gb} GB / {snap.ram.total_gb} GB"))
    print(_row("Available", f"{snap.ram.available_gb} GB"))

    # Disk
    print(f"\n  {_BOLD}Disk  ({snap.disk.mountpoint}){_RESET}")
    print(_row("Usage", _color_percent(snap.disk.percent)))
    print(_row("Bar", percent_bar(snap.disk.percent, width=24)))
    print(_row("Used / Total", f"{snap.disk.used_gb} GB / {snap.disk.total_gb} GB"))
    print(_row("Free", f"{snap.disk.free_gb} GB"))

    # Network
    print(f"\n  {_BOLD}Network{_RESET}")
    print(_row("↑ Sent",     f"{sent_val} {sent_unit}  ({snap.network.packets_sent:,} pkts)"))
    print(_row("↓ Received", f"{recv_val} {recv_unit}  ({snap.network.packets_recv:,} pkts)"))

    # Uptime
    print(f"\n  {_BOLD}System{_RESET}")
    print(_row("Uptime", f"{_CYAN}{snap.uptime.formatted}{_RESET}"))
    print(_row("Collected at", f"{_DIM}{snap.collected_at}{_RESET}"))

    print(f"\n{_DIM}  Press Ctrl+C to exit.{_RESET}\n")


# ── CLI ────────────────────────────────────────────────────────────────────────

def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m monitor",
        description="NeuroOps AI — System Monitor CLI",
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--full", action="store_true",
        help="Print full nested JSON (default prints summary only)",
    )
    mode.add_argument(
        "--stream", action="store_true",
        help="Stream snapshots at a fixed interval",
    )
    mode.add_argument(
        "--throughput", action="store_true",
        help="Measure and print real-time network throughput",
    )
    mode.add_argument(
        "--watch", action="store_true",
        help="Live terminal dashboard (refreshes every second)",
    )
    parser.add_argument(
        "--interval", type=float, default=1.0, metavar="SECS",
        help="Seconds between stream ticks or watch refresh (default: 1.0)",
    )
    parser.add_argument(
        "--count", type=int, default=None, metavar="N",
        help="Stop after N snapshots (stream mode only; default: infinite)",
    )
    parser.add_argument(
        "--mount", type=str, default="/", metavar="PATH",
        help="Disk mountpoint to monitor (default: /)",
    )
    return parser


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    svc = MonitorService(disk_mount=args.mount)

    try:
        if args.watch:
            # ── Live dashboard ──────────────────────────────────────────────
            while True:
                _render_watch(svc)
                time.sleep(args.interval)

        elif args.stream:
            # ── JSON stream ─────────────────────────────────────────────────
            for snap in svc.stream(interval=args.interval, count=args.count):
                output = snap.to_json() if args.full else snap.to_summary_json()
                print(output, flush=True)

        elif args.throughput:
            # ── Network throughput ───────────────────────────────────────────
            print(f"  Measuring throughput over {args.interval}s window…", flush=True)
            tx, rx = svc.throughput(window=args.interval)
            tx_val, tx_unit = auto_scale_bytes(int(tx))
            rx_val, rx_unit = auto_scale_bytes(int(rx))
            result = {
                "bytes_sent_per_sec":  tx,
                "bytes_recv_per_sec":  rx,
                "sent_human":   f"{tx_val} {tx_unit}/s",
                "recv_human":   f"{rx_val} {rx_unit}/s",
            }
            print(json.dumps(result, indent=2))

        elif args.full:
            # ── Full JSON snapshot ───────────────────────────────────────────
            snap = svc.snapshot()
            print(snap.to_json())

        else:
            # ── Default: summary JSON ────────────────────────────────────────
            snap = svc.snapshot()
            print(snap.to_summary_json())

    except KeyboardInterrupt:
        print(f"\n{_DIM}  Stopped.{_RESET}")
        sys.exit(0)


if __name__ == "__main__":
    main()
