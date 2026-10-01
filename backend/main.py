from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, Integer
from database import engine, Base, SessionLocal
from datetime import date, timedelta
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

import models
import schemas
import datetime
import os
from dotenv import load_dotenv

# .env dosyasındaki değişkenleri yükle
load_dotenv()
# ============================================================
# FASTAPI
# ============================================================

app = FastAPI()


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# VERİTABANI TABLOLARINI OLUŞTUR
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# DATABASE BAĞLANTISI
# ============================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "YKS Study App API çalışıyor!"
    }


# ============================================================
# ÇALIŞMA KAYITLARI
# ============================================================

@app.post("/sessions/")
def create_study_session(
    session: schemas.StudySessionCreate,
    db: Session = Depends(get_db)
):
    db_session = models.StudySession(
        subject=session.subject,
        topic=session.topic,
        duration=session.duration
    )

    if session.date:
        db_session.date = session.date

    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@app.get(
    "/sessions/",
    response_model=list[schemas.StudySessionResponse]
)
def get_all_sessions(
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(models.StudySession)
        .all()
    )
    return sessions


@app.delete("/sessions/{session_id}")
def delete_session(
    session_id: int,
    db: Session = Depends(get_db)
):
    session_to_delete = (
        db.query(models.StudySession)
        .filter(models.StudySession.id == session_id)
        .first()
    )

    if session_to_delete is None:
        raise HTTPException(
            status_code=404,
            detail="Böyle bir kayıt bulunamadı"
        )

    db.delete(session_to_delete)
    db.commit()
    return {
        "message": f"{session_id} numaralı çalışma kaydı başarıyla silindi!"
    }


# ============================================================
# ESKİ BUGÜN İSTATİSTİĞİ
# ============================================================

@app.get("/stats/today")
def get_today_stats(
    db: Session = Depends(get_db)
):
    today = date.today()

    total_minutes = (
        db.query(
            func.sum(
                models.StudySession.duration
            )
        )
        .filter(
            models.StudySession.date == today
        )
        .scalar()
    )

    if total_minutes is None:
        total_minutes = 0

    hours = total_minutes // 60
    minutes = total_minutes % 60

    return {
        "date": today,
        "total_minutes": total_minutes,
        "formatted_time": f"{hours} saat {minutes} dakika",
        "message": (
            "Tebrikler, iyi iş çıkardın!"
            if total_minutes > 0
            else "Hadi masaya, çalışma vakti!"
        )
    }


# ============================================================
# HEDEFLER
# ============================================================

@app.get("/goals")
def get_goals(
    db: Session = Depends(get_db)
):
    goal = (
        db.query(models.UserGoal)
        .first()
    )

    if not goal:
        return {
            "target_profession": "",
            "daily_study_hours": 0,
            "target_ranking": 0,
            "target_tyt_net": 0,
            "target_ayt_net": 0
        }

    return goal


@app.post("/goals")
def save_goals(
    goal_data: schemas.GoalCreate,
    db: Session = Depends(get_db)
):
    goal = (
        db.query(models.UserGoal)
        .first()
    )

    if not goal:
        goal = models.UserGoal(
            **goal_data.model_dump()
        )
        db.add(goal)
    else:
        goal.target_profession = goal_data.target_profession
        goal.daily_study_hours = goal_data.daily_study_hours
        goal.target_ranking = goal_data.target_ranking
        goal.target_tyt_net = goal_data.target_tyt_net
        goal.target_ayt_net = goal_data.target_ayt_net

    db.commit()
    db.refresh(goal)

    return {
        "message": "Hedefler başarıyla kaydedildi!",
        "data": goal
    }


# ============================================================
# HAFTALIK PROGRAM
# ============================================================

@app.get(
    "/program-tasks/",
    response_model=list[schemas.ProgramTaskResponse]
)
def get_all_program_tasks(
    db: Session = Depends(get_db)
):
    return (
        db.query(models.ProgramTask)
        .all()
    )


@app.post(
    "/program-tasks/",
    response_model=schemas.ProgramTaskResponse
)
def create_program_task(
    task: schemas.ProgramTaskCreate,
    db: Session = Depends(get_db)
):
    db_task = models.ProgramTask(
        activity_type=task.activity_type,
        subject=task.subject,
        day=task.day,
        start_time=task.start_time,
        duration=task.duration
    )

    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@app.put(
    "/program-tasks/{task_id}",
    response_model=schemas.ProgramTaskResponse
)
def update_program_task(
    task_id: int,
    task_update: schemas.ProgramTaskUpdate,
    db: Session = Depends(get_db)
):
    db_task = (
        db.query(models.ProgramTask)
        .filter(models.ProgramTask.id == task_id)
        .first()
    )

    if db_task is None:
        raise HTTPException(
            status_code=404,
            detail="Böyle bir program görevi bulunamadı"
        )

    update_data = (
        task_update.model_dump(
            exclude_unset=True
        )
    )

    for field, value in update_data.items():
        setattr(db_task, field, value)

    db.commit()
    db.refresh(db_task)
    return db_task


@app.delete("/program-tasks/{task_id}")
def delete_program_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    db_task = (
        db.query(models.ProgramTask)
        .filter(models.ProgramTask.id == task_id)
        .first()
    )

    if db_task is None:
        raise HTTPException(
            status_code=404,
            detail="Böyle bir program görevi bulunamadı"
        )

    db.delete(db_task)
    db.commit()
    return {
        "message": f"{task_id} numaralı program görevi silindi"
    }


# ============================================================
# GÜNLÜK ZAMAN DAĞILIMI
# ============================================================

@app.get("/daily-time/")
def get_daily_time(
    target_date: date | None = None,
    db: Session = Depends(get_db)
):
    if target_date is None:
        target_date = date.today()

    daily_time = (
        db.query(models.DailyTimeDistribution)
        .filter(
            models.DailyTimeDistribution.date == target_date
        )
        .first()
    )

    if daily_time is None:
        return {
            "date": target_date,
            "morning_minutes": 0,
            "afternoon_minutes": 0,
            "evening_minutes": 0
        }

    return daily_time


@app.post("/daily-time/")
def save_daily_time(
    time_data: schemas.DailyTimeDistributionCreate,
    db: Session = Depends(get_db)
):
    target_date = (
        time_data.date
        or date.today()
    )

    morning = max(0, time_data.morning_minutes)
    afternoon = max(0, time_data.afternoon_minutes)
    evening = max(0, time_data.evening_minutes)

    daily_time = (
        db.query(models.DailyTimeDistribution)
        .filter(
            models.DailyTimeDistribution.date == target_date
        )
        .first()
    )

    if daily_time is None:
        daily_time = models.DailyTimeDistribution(
            date=target_date,
            morning_minutes=morning,
            afternoon_minutes=afternoon,
            evening_minutes=evening
        )
        db.add(daily_time)
    else:
        daily_time.morning_minutes = morning
        daily_time.afternoon_minutes = afternoon
        daily_time.evening_minutes = evening

    db.commit()
    db.refresh(daily_time)
    return daily_time

# ============================================================
# GÜNLÜK ZAMAN GEÇMİŞİ
# ============================================================

@app.get("/daily-time/history")
def get_daily_time_history(
    days: int = 7,
    db: Session = Depends(get_db)
):
    records = (
        db.query(models.DailyTimeDistribution)
        .order_by(models.DailyTimeDistribution.date.desc())
        .limit(days)
        .all()
    )

    records.reverse()

    return [
        {
            "date": record.date.isoformat(),
            "total_minutes": (
                record.morning_minutes
                + record.afternoon_minutes
                + record.evening_minutes
            )
        }
        for record in records
    ]
# ============================================================
# DASHBOARD / BUGÜN
# ============================================================

@app.get("/dashboard/today")
def get_dashboard_today(
    db: Session = Depends(get_db)
):
    today = date.today()

    goal = (
        db.query(models.UserGoal)
        .first()
    )

    if goal is None:
        goals = {
            "target_profession": "",
            "daily_study_hours": 0,
            "target_ranking": 0,
            "target_tyt_net": 0,
            "target_ayt_net": 0
        }
        daily_target_minutes = 0
    else:
        goals = {
            "target_profession": goal.target_profession or "",
            "daily_study_hours": goal.daily_study_hours or 0,
            "target_ranking": goal.target_ranking or 0,
            "target_tyt_net": goal.target_tyt_net or 0,
            "target_ayt_net": goal.target_ayt_net or 0
        }
        daily_target_minutes = int(
            (goal.daily_study_hours or 0) * 60
        )

    daily_time = (
        db.query(models.DailyTimeDistribution)
        .filter(
            models.DailyTimeDistribution.date == today
        )
        .first()
    )

    if daily_time is None:
        morning_minutes = 0
        afternoon_minutes = 0
        evening_minutes = 0
    else:
        morning_minutes = daily_time.morning_minutes or 0
        afternoon_minutes = daily_time.afternoon_minutes or 0
        evening_minutes = daily_time.evening_minutes or 0

    distribution_total = (
        morning_minutes
        + afternoon_minutes
        + evening_minutes
    )

    total_minutes = distribution_total
    hours = total_minutes // 60
    minutes = total_minutes % 60
    formatted_time = f"{hours} saat {minutes} dakika"

    if daily_target_minutes > 0:
        goal_percentage = round(
            (total_minutes / daily_target_minutes) * 100,
            1
        )
        goal_percentage = min(goal_percentage, 100)
    else:
        goal_percentage = 0

    if distribution_total > 0:
        morning_percentage = round(
            (morning_minutes / distribution_total) * 100,
            1
        )
        afternoon_percentage = round(
            (afternoon_minutes / distribution_total) * 100,
            1
        )
        evening_percentage = round(
            100 - morning_percentage - afternoon_percentage,
            1
        )
    else:
        morning_percentage = 0
        afternoon_percentage = 0
        evening_percentage = 0

    sessions = (
        db.query(models.StudySession)
        .filter(models.StudySession.date == today)
        .all()
    )

    subject_summary = {}
    for session in sessions:
        subject = session.subject or "Diğer"
        if subject not in subject_summary:
            subject_summary[subject] = 0
        subject_summary[subject] += session.duration or 0

    subject_summary_list = [
        {"subject": subject, "total_minutes": minutes}
        for subject, minutes in subject_summary.items()
    ]
    subject_summary_list.sort(
        key=lambda item: item["total_minutes"],
        reverse=True
    )

    return {
        "date": today,
        "goals": goals,
        "today": {
            "total_minutes": total_minutes,
            "formatted_time": formatted_time,
            "goal_percentage": goal_percentage
        },
        "time_distribution": {
            "morning_minutes": morning_minutes,
            "afternoon_minutes": afternoon_minutes,
            "evening_minutes": evening_minutes,
            "total_minutes": distribution_total,
            "morning_percentage": morning_percentage,
            "afternoon_percentage": afternoon_percentage,
            "evening_percentage": evening_percentage
        },
        "subject_summary": subject_summary_list
    }


# ============================================================
# MATEMATİK & GEOMETRİ PROGRAM GÖREVLERİ GEÇMİŞİ (SÜRE BAZLI)
# ============================================================
@app.get("/study/math-history")
def math_history(days: int = 7, db: Session = Depends(get_db)):
    today = date.today()
    start = today - timedelta(days=days - 1)

    result = []
    for i in range(days):
        d = start + timedelta(days=i)
        
        # O güne ait tamamlanmış program görevlerini bul
        completed_records = (
            db.query(models.ProgramTask)
            .join(models.TaskRecord, models.ProgramTask.id == models.TaskRecord.task_id)
            .filter(
                models.TaskRecord.record_date == d,
                models.TaskRecord.is_completed == True,
                or_(
                    models.ProgramTask.subject.ilike("%matematik%"),
                    models.ProgramTask.subject.ilike("%geometri%"),
                    models.ProgramTask.activity_type.ilike("%matematik%"),
                    models.ProgramTask.activity_type.ilike("%geometri%"),
                )
            )
            .all()
        )

        # O gün tamamlanan görevlerin toplam dakikasını hesapla
        total_minutes = sum(task.duration for task in completed_records)

        result.append({
            "date": d.isoformat(),
            "hours": round(total_minutes / 60, 1),
            "minutes": total_minutes
        })

    return result

# ============================================================
# ÇALIŞMALARIM / GÜNLÜK GÖREVLER
# ============================================================

class TaskRecordToggle(BaseModel):
    task_id: int
    record_date: str
    is_completed: bool


@app.get("/studies/daily")
def get_daily_tasks(day: str, date_str: str, db: Session = Depends(get_db)):
    try:
        if "." in date_str:
            parts = date_str.split(".")
            target_date = datetime.date(int(parts[2]), int(parts[1]), int(parts[0]))
        else:
            target_date = datetime.date.fromisoformat(date_str)
    except Exception:
        target_date = datetime.date.today()

    tasks = (
        db.query(models.ProgramTask)
        .filter(models.ProgramTask.day == day)
        .order_by(models.ProgramTask.start_time)
        .all()
    )

    daily_list = []
    for task in tasks:
        record = (
            db.query(models.TaskRecord)
            .filter(
                models.TaskRecord.task_id == task.id,
                models.TaskRecord.record_date == target_date
            )
            .first()
        )
        daily_list.append({
            "id": task.id,
            "type": task.activity_type,
            "subject": task.subject if task.subject else task.activity_type,
            "time": task.start_time,
            "completed": record.is_completed if record else False
        })

    return daily_list


@app.post("/studies/toggle")
def toggle_task_record(
    data: TaskRecordToggle,
    db: Session = Depends(get_db)
):
    record_date_obj = datetime.date.fromisoformat(data.record_date)

    record = (
        db.query(models.TaskRecord)
        .filter(
            models.TaskRecord.task_id == data.task_id,
            models.TaskRecord.record_date == record_date_obj
        )
        .first()
    )

    if record:
        record.is_completed = data.is_completed
    else:
        record = models.TaskRecord(
            task_id=data.task_id,
            record_date=record_date_obj,
            is_completed=data.is_completed
        )
        db.add(record)

    db.commit()

    return {
        "status": "success",
        "message": "Görev durumu başarıyla kaydedildi"
    }

# ============================================================
# 7 GÜNLÜK EKSİKLER PANOSU
# ============================================================
@app.get("/studies/missed")
def get_missed_tasks(db: Session = Depends(get_db)):
    today = datetime.date.today()
    missed_list = []

    turkish_days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]

    for i in range(1, 8):
        past_date = today - datetime.timedelta(days=i)
        day_name = turkish_days[past_date.weekday()]

        tasks = db.query(models.ProgramTask).filter(
            func.lower(models.ProgramTask.day) == day_name.lower()
        ).all()

        for task in tasks:
            record = db.query(models.TaskRecord).filter(
                models.TaskRecord.task_id == task.id,
                models.TaskRecord.record_date == past_date
            ).first()

            is_done = record.is_completed if record else False
            if not is_done:
                missed_list.append({
                    "task_id": task.id,
                    "date": str(past_date),
                    "day": day_name,
                    "subject": task.subject if task.subject else task.activity_type,
                    "type": task.activity_type,
                    "time": task.start_time
                })

    return missed_list

@app.post("/exams/", response_model=schemas.ExamResponse)
def create_exam(
    exam: schemas.ExamCreate,
    db: Session = Depends(get_db)
):
    new_exam = models.Exam(
        exam_type=exam.exam_type,
        name=exam.name,
        date=exam.date,
        note=exam.note
    )

    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)

    return new_exam

@app.get("/exams/", response_model=list[schemas.ExamResponse])
def get_exams(
    db: Session = Depends(get_db)
):
    exams = (
        db.query(models.Exam)
        .order_by(models.Exam.date.desc())
        .all()
    )

    return exams

@app.post(
    "/exams/{exam_id}/results",
    response_model=schemas.ExamResultResponse
)
def create_exam_result(
    exam_id: int,
    result: schemas.ExamResultCreate,
    db: Session = Depends(get_db)
):
    exam = (
        db.query(models.Exam)
        .filter(models.Exam.id == exam_id)
        .first()
    )

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Deneme bulunamadı."
        )

    net = result.correct - (result.wrong / 4)

    new_result = models.ExamResult(
        exam_id=exam_id,
        subject=result.subject,
        correct=result.correct,
        wrong=result.wrong,
        blank=result.blank,
        net=net
    )

    db.add(new_result)
    db.commit()
    db.refresh(new_result)

    return new_result

@app.get(
    "/exams/{exam_id}/results",
    response_model=list[schemas.ExamResultResponse]
)
def get_exam_results(
    exam_id: int,
    db: Session = Depends(get_db)
):
    results = (
        db.query(models.ExamResult)
        .filter(models.ExamResult.exam_id == exam_id)
        .all()
    )

    return results


@app.delete("/exams/{exam_id}")
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Deneme bulunamadı.")
    
    db.query(models.ExamResult).filter(models.ExamResult.exam_id == exam_id).delete()
    db.delete(exam)
    db.commit()
    
    return {"message": "Deneme başarıyla silindi."}


@app.get("/subjects/", response_model=List[schemas.SubjectDetailResponse])
def get_subjects(exam_type: str, db: Session = Depends(get_db)):
    subjects = db.query(models.Subject).filter(models.Subject.exam_type == exam_type).all()
    
    result = []
    for sub in subjects:
        progress = db.query(models.SubjectProgress).filter(models.SubjectProgress.subject_id == sub.id).first()
        rounds = progress.completed_rounds if progress else 0
        
        topics = db.query(models.Topic).filter(models.Topic.subject_id == sub.id).all()
        
        result.append({
            "id": sub.id,
            "name": sub.name,
            "exam_type": sub.exam_type,
            "completed_rounds": rounds,
            "topics": topics
        })
        
    return result

@app.patch("/topics/{topic_id}/toggle", response_model=dict)
def toggle_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Konu bulunamadı.")
    
    topic.is_completed = not topic.is_completed
    db.commit()
    
    subject_id = topic.subject_id
    
    all_topics = db.query(models.Topic).filter(models.Topic.subject_id == subject_id).all()
    total_topics = len(all_topics)
    completed_topics = sum(1 for t in all_topics if t.is_completed)
    
    round_completed_message = None
    
    if total_topics > 0 and completed_topics == total_topics:
        progress = db.query(models.SubjectProgress).filter(models.SubjectProgress.subject_id == subject_id).first()
        if not progress:
            progress = models.SubjectProgress(subject_id=subject_id, completed_rounds=0)
            db.add(progress)
            db.commit()
            db.refresh(progress)
            
        progress.completed_rounds += 1
        
        for t in all_topics:
            t.is_completed = False
            
        db.commit()
        
        subject_obj = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
        sub_name = subject_obj.name if subject_obj else "Ders"
        
        round_completed_message = f"🎉 Tebrikler! {sub_name} dersinin {progress.completed_rounds}. tam turunu tamamladın. Yeni tur başladı!"

    progress_check = db.query(models.SubjectProgress).filter(models.SubjectProgress.subject_id == subject_id).first()
    current_rounds = progress_check.completed_rounds if progress_check else 0
    
    return {
        "success": True,
        "is_completed": topic.is_completed,
        "completed_rounds": current_rounds,
        "message": round_completed_message
    }

@app.patch("/subjects/{subject_id}/rounds")
def update_subject_rounds(subject_id: int, data: dict, db: Session = Depends(get_db)):
    new_rows = data.get("completed_rounds", 0)
    progress = db.query(models.SubjectProgress).filter(models.SubjectProgress.subject_id == subject_id).first()
    
    if not progress:
        progress = models.SubjectProgress(subject_id=subject_id, completed_rounds=new_rows)
        db.add(progress)
    else:
        progress.completed_rounds = new_rows
        
    db.commit()
    return {"success": True, "completed_rounds": progress.completed_rounds}