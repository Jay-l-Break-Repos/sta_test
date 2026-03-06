from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Header, Response
from fastapi.responses import HTMLResponse
from datetime import datetime, timezone
from sqlmodel import Session, select, func
from app.core.database import get_session
from app.models.document import Document, DocumentRead
from app.services.storage import save_upload_file
import os

router = APIRouter()

@router.post("/upload", response_model=DocumentRead)
async def upload_document(
    file: UploadFile = File(...),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    session: Session = Depends(get_session)
):
    try:
        filename = os.path.basename(file.filename).strip()
        if not filename:
            raise HTTPException(status_code=400, detail="Filename cannot be empty.")
        
        current_user = x_user_id or "Anonymous"
        
        # Check for existing document by name
        existing_doc = session.exec(
            select(Document).where(func.lower(Document.name) == func.lower(filename))
        ).first()
        
        file_path = save_upload_file(file)
        
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read().replace("\x00", "")

        if existing_doc:
            existing_doc.size = os.path.getsize(file_path)
            existing_doc.created_at = datetime.now(timezone.utc)
            existing_doc.last_modified_by = current_user
            existing_doc.extracted_text = content
            existing_doc.path = file_path
            db_doc = existing_doc
        else:
            db_doc = Document(
                name=filename,
                size=os.path.getsize(file_path),
                content_type=file.content_type,
                path=file_path,
                owner_id=1,
                last_modified_by=current_user,
                extracted_text=content
            )
        
        session.add(db_doc)
        session.commit()
        session.refresh(db_doc)
        
        # Ensure DocumentRead has versions
        return DocumentRead(**db_doc.dict(), versions=[])
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Keep minimal error logging
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[DocumentRead])
async def read_documents(
    session: Session = Depends(get_session)
):
    # Fetch all documents, sorted by ID descending
    db_docs = session.exec(select(Document).order_by(Document.id.desc())).all()
    return [DocumentRead(**doc.dict(), versions=[]) for doc in db_docs]

@router.get("/{document_id}")
async def get_document(document_id: int, session: Session = Depends(get_session)):
    document = session.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    # Return as DocumentRead with empty versions
    return DocumentRead(**document.dict(), versions=[])

@router.get("/{document_id}/view")
async def view_document(
    document_id: int,
    session: Session = Depends(get_session)
):
    document = session.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(document.path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    with open(document.path, 'r', encoding='utf-8', errors='ignore') as f:
        text_content = f.read()
    
    return Response(content=text_content, media_type="text/plain")


@router.delete("/{document_id}", status_code=200)
async def delete_document(
    document_id: int,
    session: Session = Depends(get_session)
):
    """
    Delete a document by ID.
    
    Args:
        document_id: ID of the document to delete
        session: Database session
        
    Returns:
        Empty response with 200 status code on success
        
    Raises:
        HTTPException: 404 if document not found, 500 for server errors
    """
    try:
        # Get the document from database
        document = session.get(Document, document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete the document from database
        session.delete(document)
        session.commit()
        
        # Return empty response with 200 status code
        return Response(status_code=200)
        
    except HTTPException:
        # Re-raise HTTP exceptions we've created
        raise
    except Exception as e:
        # Log the error for debugging
        import traceback
        traceback.print_exc()
        print(f"ERROR deleting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
