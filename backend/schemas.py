from pydantic import BaseModel
from datetime import date as DateType
from typing import Optional, List
import models
import schemas

# ============================================================
# ÇALIŞMA KAYDI
# ============================================================

class StudySessionCreate(BaseModel):
    subject: str
    topic: str
    duration: int
    date: Optional[DateType] = None


class StudySessionResponse(StudySessionCreate):
    id: int
    date: DateType

    class Config:
        from_attributes = True


# ============================================================
# KULLANICI HEDEFLERİ
# ============================================================

class GoalCreate(BaseModel):
    target_profession: str
    daily_study_hours: float
    target_ranking: int
    target_tyt_net: float
    target_ayt_net: float


class GoalResponse(BaseModel):
    id: int
    target_profession: Optional[str] = None
    daily_study_hours: Optional[float] = None
    target_ranking: Optional[int] = None
    target_tyt_net: Optional[float] = None
    target_ayt_net: Optional[float] = None


    class Config:
        from_attributes = True


# ============================================================
# HAFTALIK PROGRAM
# ============================================================

class ProgramTaskCreate(BaseModel):
    """
    Haftalık programa yeni bir görev eklemek için kullanılır.
    """

    activity_type: str

    subject: Optional[str] = None

    day: str

    start_time: str

    duration: int = 60


class ProgramTaskUpdate(BaseModel):
    """
    Programdaki bir görevi taşımak veya düzenlemek için kullanılır.
    """

    activity_type: Optional[str] = None
    subject: Optional[str] = None
    day: Optional[str] = None
    start_time: Optional[str] = None
    duration: Optional[int] = None


class ProgramTaskResponse(BaseModel):
    id: int
    activity_type: str
    subject: Optional[str] = None
    day: str
    start_time: str
    duration: int

    class Config:
        from_attributes = True


# ============================================================
# GÜNLÜK ZAMAN DAĞILIMI
# ============================================================

class DailyTimeDistributionCreate(BaseModel):
    """
    Bir gün içerisindeki çalışma süresini
    sabah / öğleden sonra / akşam olarak kaydetmek için kullanılır.
    """

    morning_minutes: int = 0
    afternoon_minutes: int = 0
    evening_minutes: int = 0

    date: Optional[DateType] = None


class DailyTimeDistributionResponse(BaseModel):
    id: int
    date: DateType

    morning_minutes: int
    afternoon_minutes: int
    evening_minutes: int

    class Config:
        from_attributes = True

class ExamCreate(BaseModel):
    exam_type: str
    name: str
    date: DateType
    note: Optional[str] = None


class ExamResponse(BaseModel):
    id: int
    exam_type: str
    name: str
    date: DateType
    note: Optional[str] = None

    class Config:
        from_attributes = True


class ExamResultCreate(BaseModel):
    subject: str
    correct: int = 0
    wrong: int = 0
    blank: int = 0


class ExamResultResponse(BaseModel):
    id: int
    exam_id: int
    subject: str
    correct: int
    wrong: int
    blank: int
    net: float

    class Config:
        from_attributes = True



# Konu Şeması
class TopicResponse(BaseModel):
    id: int
    subject_id: int
    name: str
    is_completed: bool

    class Config:
        from_attributes = True

# Konu Güncelleme Şeması (Kutucuğa tıklandığında)
class TopicUpdate(BaseModel):
    is_completed: bool

# Ders İlerleme Şeması
class SubjectProgressResponse(BaseModel):
    subject_id: int
    completed_rounds: int

    class Config:
        from_attributes = True

# Ders ve Detayları Şeması (Konular ve Tur sayısı dahil)
class SubjectDetailResponse(BaseModel):
    id: int
    name: str
    exam_type: str
    completed_rounds: int
    topics: List[TopicResponse] = []

    class Config:
        from_attributes = True