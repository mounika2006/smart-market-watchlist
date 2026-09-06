from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from backend.app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    watchlists = relationship(
        "Watchlist",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    observations = relationship(
        "Observation",
        back_populates="user",
        cascade="all, delete-orphan"
    )


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship(
        "User",
        back_populates="watchlists"
    )

    stocks = relationship(
        "WatchlistStock",
        back_populates="watchlist",
        cascade="all, delete-orphan"
    )


class WatchlistStock(Base):
    __tablename__ = "watchlist_stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False)
    watchlist_id = Column(
        Integer,
        ForeignKey("watchlists.id"),
        nullable=False
    )
    priority = Column(Integer, default=0)
    added_at = Column(DateTime, default=datetime.utcnow)

    watchlist = relationship(
        "Watchlist",
        back_populates="stocks"
    )


class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    score = Column(Integer, default=0)
    checked_at = Column(DateTime, default=datetime.utcnow)

    user = relationship(
        "User",
        back_populates="observations"
    )


class MarketEvent(Base):
    __tablename__ = "market_events"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)