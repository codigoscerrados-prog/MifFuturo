from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import update  # ✅ IMPORTANTE
import uuid

from app.core.deps import get_db, require_role, get_usuario_actual
from app.core.slug import slugify
from app.modelos.modelos import Complejo, Cancha, User
from app.esquemas.esquemas import ComplejoCrear, ComplejoActualizar, ComplejoOut

router = APIRouter(prefix="/admin/complejos", tags=["admin-complejos"])


def _slug_base(nombre: str) -> str:
    base = slugify(nombre or "")
    return base or "complejo"


@router.get("", response_model=list[ComplejoOut], dependencies=[Depends(require_role("admin"))])
def listar(db: Session = Depends(get_db)):
    return db.query(Complejo).order_by(Complejo.id.desc()).all()


@router.post("", response_model=ComplejoOut, dependencies=[Depends(require_role("admin"))])
def crear(payload: ComplejoCrear, db: Session = Depends(get_db), u=Depends(get_usuario_actual)):
    base = _slug_base(payload.nombre)
    temp_slug = f"{base}-tmp-{uuid.uuid4().hex[:8]}"
    c = Complejo(**payload.model_dump(exclude_none=True), created_by=u.id, slug=temp_slug)
    db.add(c)
    db.commit()
    db.refresh(c)
    existe = (
        db.query(Complejo)
        .filter(Complejo.slug == base, Complejo.id != c.id)
        .first()
    )
    c.slug = f"{base}-{c.id}" if existe else base
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.patch("/{complejo_id}", response_model=ComplejoOut, dependencies=[Depends(require_role("admin"))])
def actualizar(complejo_id: int, payload: ComplejoActualizar, db: Session = Depends(get_db)):
    c = db.query(Complejo).filter(Complejo.id == complejo_id).first()
    if not c:
        raise HTTPException(404, "Complejo no encontrado")

    data = payload.model_dump(exclude_none=True)
    if "slug" in data:
        nuevo = slugify(data.get("slug") or "")
        if not nuevo:
            raise HTTPException(400, "Slug invalido")
        existente = (
            db.query(Complejo)
            .filter(Complejo.slug == nuevo, Complejo.id != c.id)
            .first()
        )
        if existente:
            raise HTTPException(409, "El slug ya esta en uso")
        c.slug = nuevo
        data.pop("slug", None)

    for k, v in data.items():
        setattr(c, k, v)

    db.commit()
    db.refresh(c)
    return c


@router.post(
    "/{complejo_id}/asignar-dueno/{owner_id}",
    response_model=ComplejoOut,
    dependencies=[Depends(require_role("admin"))],
)
def asignar_dueno(complejo_id: int, owner_id: int, db: Session = Depends(get_db)):
    c = db.query(Complejo).filter(Complejo.id == complejo_id).first()
    if not c:
        raise HTTPException(404, "Complejo no encontrado")

    u = db.query(User).filter(User.id == owner_id).first()
    if not u:
        raise HTTPException(404, "Usuario no existe")
    if u.role not in ("propietario", "admin"):
        raise HTTPException(400, "El usuario no es propietario")

    # 1) asigna dueño al complejo
    c.owner_id = owner_id

    # 2) ✅ sincroniza dueño en TODAS las canchas de ese complejo
    db.execute(
        update(Cancha)
        .where(Cancha.complejo_id == complejo_id)
        .values(owner_id=owner_id)
    )

    db.commit()
    db.refresh(c)
    return c
