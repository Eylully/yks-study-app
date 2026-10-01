from sqlalchemy import Column, Integer, String, Date, Float, DateTime, Boolean
from database import Base
import datetime


# ============================================================
# ÇALIŞMA KAYDI
# ============================================================

class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)

    subject = Column(String, index=True)

    topic = Column(String)

    # Dakika cinsinden çalışma süresi
    duration = Column(Integer)

    date = Column(
        Date,
        default=datetime.date.today
    )


# ============================================================
# KULLANICI HEDEFLERİ
# ============================================================

class UserGoal(Base):
    __tablename__ = "user_goals"

    id = Column(Integer, primary_key=True, index=True)

    target_profession = Column(
        String,
        nullable=True
    )

    daily_study_hours = Column(
        Float,
        nullable=True
    )

    target_ranking = Column(
        Integer,
        nullable=True
    )

    target_tyt_net = Column(
        Float, 
        nullable=True
    )
    target_ayt_net = Column(
        Float, 
        nullable=True
    )


# ============================================================
# HAFTALIK PROGRAM
# ============================================================

class ProgramTask(Base):
    """
    Kullanıcının haftalık programındaki görevleri tutar.
    """

    __tablename__ = "program_tasks"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # test, konu, video, brans_deneme,
    # mola, genel_deneme, kitap
    activity_type = Column(
        String,
        nullable=False,
        index=True
    )

    # Matematik, Türkçe vb.
    subject = Column(
        String,
        nullable=True,
        index=True
    )

    # Pazartesi, Salı...
    day = Column(
        String,
        nullable=False,
        index=True
    )

    # Örneğin 09:00
    start_time = Column(
        String,
        nullable=False
    )

    # Dakika
    duration = Column(
        Integer,
        nullable=False,
        default=60
    )

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )


# ============================================================
# GÜNLÜK ZAMAN DAĞILIMI
# ============================================================

class DailyTimeDistribution(Base):
    """
    Kullanıcının bir gün içerisinde ne kadar çalıştığını
    sabah / öğleden sonra / akşam olarak tutar.
    """

    __tablename__ = "daily_time_distributions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    date = Column(
        Date,
        unique=True,
        nullable=False,
        index=True
    )

    # Dakika cinsinden
    morning_minutes = Column(
        Integer,
        nullable=False,
        default=0
    )

    afternoon_minutes = Column(
        Integer,
        nullable=False,
        default=0
    )

    evening_minutes = Column(
        Integer,
        nullable=False,
        default=0
    )

class TaskRecord(Base):
    __tablename__ = "task_records"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, nullable=False, index=True)
    record_date = Column(Date, nullable=False, index=True)
    is_completed = Column(Boolean, default=False)

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    exam_type = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    date = Column(Date, nullable=False, index=True)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ExamResult(Base):
    __tablename__ = "exam_results"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, nullable=False, index=True)
    subject = Column(String, nullable=False, index=True)
    correct = Column(Integer, nullable=False, default=0)
    wrong = Column(Integer, nullable=False, default=0)
    blank = Column(Integer, nullable=False, default=0)
    net = Column(Float, nullable=False, default=0)

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    exam_type = Column(String, nullable=False, index=True)


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, nullable=False, index=True)
    name = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)


class SubjectProgress(Base):
    __tablename__ = "subject_progress"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, nullable=False, unique=True, index=True)
    completed_rounds = Column(Integer, nullable=False, default=0)