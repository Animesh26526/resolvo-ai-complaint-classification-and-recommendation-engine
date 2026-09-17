from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from typing import Optional
from app.schemas.audio_schema import (
    TranscriptionResponse,
    AudioComplaintResponse,
)
from app.schemas.analysis_schema import AnalyzeComplaintResponse
from app.services.gemini_service import GeminiAudioService
from app.services.complaint_analyzer import ComplaintAnalyzerService

router = APIRouter(tags=["Gemini Speech & Audio Pipeline"])

gemini_service = GeminiAudioService()
analyzer_service = ComplaintAnalyzerService()


@router.post(
    "/transcribe",
    response_model=TranscriptionResponse,
    status_code=status.HTTP_200_OK,
)
@router.post(
    "/api/transcribe",
    response_model=TranscriptionResponse,
    status_code=status.HTTP_200_OK,
)
async def transcribe_audio_file(
    file: UploadFile = File(..., description="Audio recording of customer helpline call or chatbot voice note")
):
    """
    Transcribe customer call audio into clean plain text via Gemini.
    Supported audio formats: wav, mp3, webm, ogg, m4a, flac.
    """
    try:
        content_type = file.content_type or "audio/webm"
        audio_bytes = await file.read()

        if not audio_bytes or len(audio_bytes) < 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty or too short"
            )

        transcription = await gemini_service.transcribe_audio(
            audio_bytes=audio_bytes,
            mime_type=content_type,
            filename=file.filename,
        )
        return transcription

    except HTTPException:
        raise
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech transcription failed: {str(err)}"
        )


@router.post(
    "/api/audio-complaint",
    response_model=AudioComplaintResponse,
    status_code=status.HTTP_200_OK,
)
async def process_audio_complaint(
    file: UploadFile = File(..., description="Audio complaint to transcribe and analyze"),
    channel: Optional[str] = Form("call")
):
    """
    Complete Voice Workflow:
    Audio File -> Gemini Transcription -> Multi-Model Complaint Analysis
    """
    try:
        content_type = file.content_type or "audio/webm"
        audio_bytes = await file.read()

        if not audio_bytes or len(audio_bytes) < 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty or too short"
            )

        # 1. Transcribe audio with Gemini
        transcription_res = await gemini_service.transcribe_audio(
            audio_bytes=audio_bytes,
            mime_type=content_type,
            filename=file.filename,
        )

        transcript = transcription_res.transcript

        # 2. Feed transcript into multi-model AI pipeline
        analysis_result = await analyzer_service.analyze(
            description=transcript,
            channel=channel or "call"
        )

        return AudioComplaintResponse(
            transcript=transcript,
            analysis=AnalyzeComplaintResponse(**analysis_result),
        )

    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio complaint processing pipeline failed: {str(err)}"
        )
