from typing import Optional, Any, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_


class BaseRepository:
    def __init__(self, session: AsyncSession, model_class=None):
        self.session = session
        self.model_class = model_class

    async def get(self, record_id: str):
        query = select(self.model_class).where(self.model_class.id == record_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        filters: Optional[dict] = None,
        sorts: Optional[List[tuple]] = None,
        search_columns: Optional[List[str]] = None,
    ) -> Tuple[List, int]:
        query = select(self.model_class)
        count_query = select(func.count()).select_from(self.model_class)

        if filters:
            for key, value in filters.items():
                if key == "_search" and search_columns and value:
                    conditions = []
                    for col_name in search_columns:
                        if hasattr(self.model_class, col_name):
                            col = getattr(self.model_class, col_name)
                            conditions.append(col.ilike(f"%{value}%"))
                    if conditions:
                        query = query.where(or_(*conditions))
                        count_query = count_query.where(or_(*conditions))
                elif hasattr(self.model_class, key) and value is not None:
                    column = getattr(self.model_class, key)
                    if isinstance(value, (list, tuple)):
                        query = query.where(column.in_(value))
                        count_query = count_query.where(column.in_(value))
                    elif isinstance(value, str) and value.startswith("_ilike:"):
                        query = query.where(column.ilike(value[7:]))
                        count_query = count_query.where(column.ilike(value[7:]))
                    else:
                        query = query.where(column == value)
                        count_query = count_query.where(column == value)

        if sorts:
            for column_name, direction in sorts:
                if hasattr(self.model_class, column_name):
                    column = getattr(self.model_class, column_name)
                    if direction == "desc":
                        query = query.order_by(column.desc())
                    else:
                        query = query.order_by(column.asc())
        else:
            for fallback_col in ["created_at", "read_at", "searched_at", "published_at"]:
                if hasattr(self.model_class, fallback_col):
                    query = query.order_by(getattr(self.model_class, fallback_col).desc())
                    break

        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def create(self, **kwargs) -> Any:
        instance = self.model_class(**kwargs)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def update(self, record_id: str, **kwargs) -> Optional[Any]:
        instance = await self.get(record_id)
        if not instance:
            return None
        for key, value in kwargs.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def delete(self, record_id: str) -> bool:
        instance = await self.get(record_id)
        if not instance:
            return False
        await self.session.delete(instance)
        await self.session.flush()
        return True

    async def count(self, filters: Optional[dict] = None) -> int:
        query = select(func.count()).select_from(self.model_class)
        if filters:
            for key, value in filters.items():
                if hasattr(self.model_class, key) and value is not None:
                    query = query.where(getattr(self.model_class, key) == value)
        result = await self.session.execute(query)
        return result.scalar() or 0
