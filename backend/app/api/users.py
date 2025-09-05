from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import (
    UserResponse, UserUpdate, UserPreferenceCreate, 
    UserPreferenceUpdate, UserPreferenceResponse
)
from app.crud import (
    get_user_preference, create_user_preference, update_user_preference,
    update_user
)
from app.auth import get_current_active_user

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """
    Get current user profile
    """
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user profile
    """
    updated_user = update_user(db, current_user.id, user_update.dict(exclude_unset=True))
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return updated_user

@router.get("/preferences", response_model=UserPreferenceResponse)
async def get_user_preferences(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current user preferences
    """
    preferences = get_user_preference(db, current_user.id)
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User preferences not found"
        )
    return preferences

@router.post("/preferences", response_model=UserPreferenceResponse, status_code=status.HTTP_201_CREATED)
async def create_user_preferences(
    preferences: UserPreferenceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create user preferences
    """
    # Check if preferences already exist
    existing_preferences = get_user_preference(db, current_user.id)
    if existing_preferences:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User preferences already exist"
        )
    
    db_preferences = create_user_preference(db, current_user.id, preferences)
    return db_preferences

@router.put("/preferences", response_model=UserPreferenceResponse)
async def update_user_preferences(
    preferences: UserPreferenceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update user preferences
    """
    updated_preferences = update_user_preference(
        db, 
        current_user.id, 
        preferences.dict(exclude_unset=True)
    )
    if not updated_preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User preferences not found"
        )
    return updated_preferences
