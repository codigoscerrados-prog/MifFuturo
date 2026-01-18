from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_db
from app.modelos.modelos import Cancha, Complejo
from app.esquemas.esquemas import CanchaOut, ComplejoPublicOut

router = APIRouter(prefix="", tags=["public-canchas"])

@router.get("/complejos", response_model=list[ComplejoPublicOut])
def listar_complejos_publicos(db: Session = Depends(get_db)):
    return (
        db.query(Complejo)
        .options(
            joinedload(Complejo.canchas).joinedload(Cancha.imagenes),
            joinedload(Complejo.owner),
        )
        .filter(Complejo.is_active == True)
        .order_by(Complejo.id.desc())
        .all()
    )

@router.get("/canchas", response_model=list[CanchaOut])
def listar_canchas_publicas(db: Session = Depends(get_db)):
    return (
        db.query(Cancha)
        .options(
            joinedload(Cancha.complejo).joinedload(Complejo.owner),  # ✅ trae users.phone
            joinedload(Cancha.imagenes),
        )
        .order_by(Cancha.id.desc())
        .all()
    )
