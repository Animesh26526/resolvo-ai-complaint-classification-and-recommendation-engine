from fastapi import APIRouter, HTTPException, status
from app.schemas.chatbot_schema import ChatRequest, ChatResponse
from app.services.gpt_oss_service import GptOssService

router = APIRouter(tags=["AI Conversational Chatbot"])

gpt_oss_service = GptOssService()


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
)
@router.post(
    "/api/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
)
async def chat_interaction(payload: ChatRequest):
    """
    Conversational chatbot powered by GPT-OSS-20B.
    Guides users, answers questions regarding wellness products,
    and advises when formal complaints need to be registered or escalated.
    """
    try:
        response = await gpt_oss_service.chat(
            message=payload.message,
            history=payload.history,
            complaint_context=payload.complaint_context,
        )
        return response
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during conversational processing: {str(err)}"
        )
