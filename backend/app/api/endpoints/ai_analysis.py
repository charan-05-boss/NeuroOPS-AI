"""
NeuroOps AI — Root AI Analysis Endpoint
GET /ai-analysis — Details about system state analysis powered by AI
"""
from fastapi import APIRouter, HTTPException

from app.models.ai_analysis import AiAnalysisResponse, AiChatRequest, AiChatResponse
from app.services.ai_analyst import ai_analyst
from app.services.system_monitor import system_monitor
from app.api.endpoints.system_info import get_system_info

router = APIRouter(tags=["AI Analysis"])


@router.get(
    "/ai-analysis",
    response_model=AiAnalysisResponse,
    summary="Get system AI analysis",
)
async def get_ai_analysis() -> AiAnalysisResponse:
    """
    Returns an AI-powered analysis of the current system load, issues, anomalies,
    and DevOps optimizations.
    """
    try:
        # Get latest metrics snapshot
        snapshot = system_monitor.get_current()
        
        # Get static hardware specifications
        try:
            sys_info = await get_system_info()
        except Exception:
            sys_info = None

        # Execute analysis
        analysis = await ai_analyst.analyze(snapshot, sys_info)
        return analysis
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute system AI analysis: {str(exc)}"
        )


@router.post(
    "/ai-chat",
    response_model=AiChatResponse,
    summary="Chat with the DevOps AI assistant",
)
async def post_ai_chat(payload: AiChatRequest) -> AiChatResponse:
    """
    Interact with the DevOps assistant.
    """
    try:
        snapshot = system_monitor.get_current()
        try:
            sys_info = await get_system_info()
        except Exception:
            sys_info = None

        response_text = await ai_analyst.chat(
            payload.message,
            payload.history,
            snapshot,
            sys_info
        )
        return AiChatResponse(response=response_text)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute AI chat query: {str(exc)}"
        )
