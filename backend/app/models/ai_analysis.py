"""
NeuroOps AI — AI Analysis Models
Pydantic schemas for the AI analysis response.
"""
from typing import List
from pydantic import BaseModel, Field


class AiAnalysisResponse(BaseModel):
    system_state: str = Field(
        ...,
        description="Brief summary of CPU, memory, disk, network, and active processes",
    )
    possible_issues: List[str] = Field(
        default_factory=list,
        description="List of detected bottlenecks, resource hogs, or operational anomalies",
    )
    suspicious_behavior: List[str] = Field(
        default_factory=list,
        description="Indicators of suspicious system activity (e.g. process ratios, spike deviations)",
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Actionable DevOps recommendations to resolve issues or optimize resources",
    )
    concise_insight: str = Field(
        ...,
        description="A single-sentence concise operational insight summarizing the system state",
    )


class AiChatRequest(BaseModel):
    message: str
    history: List[dict] = Field(default_factory=list)


class AiChatResponse(BaseModel):
    response: str
