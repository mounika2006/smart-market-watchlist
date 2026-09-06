from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import and_

from backend.app.database import Base, engine, get_db
from backend.app.models import (
    User,
    Watchlist,
    WatchlistStock,
    Observation
)
from backend.app.auth import (
    hash_password,
    verify_password,
    create_token,
    decode_token
)
from backend.app.market import get_stock
from backend.app.change_engine import calculate_change


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Smart Market Watchlist",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        token = authorization.replace(
            "Bearer ",
            ""
        )

        payload = decode_token(token)

        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        user = db.query(User).filter(
            User.id == user_id
        ).first()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        return user

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


@app.get("/")
def home():
    return {
        "message": "Smart Market Watchlist API",
        "status": "running"
    }


@app.post("/auth/register")
def register(
    data: dict,
    db: Session = Depends(get_db)
):
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        raise HTTPException(
            status_code=400,
            detail="Name, email and password are required"
        )

    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    user = User(
        name=name,
        email=email,
        password=hash_password(password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    default_watchlist = Watchlist(
        name="My Watchlist",
        user_id=user.id
    )

    db.add(default_watchlist)
    db.commit()

    return {
        "message": "Registration successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }


@app.post("/auth/login")
def login(
    data: dict,
    db: Session = Depends(get_db)
):
    email = data.get("email")
    password = data.get("password")

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_token(user.id)

    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }


@app.get("/watchlists")
def get_watchlists(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    watchlists = db.query(Watchlist).filter(
        Watchlist.user_id == user.id
    ).all()

    return [
        {
            "id": watchlist.id,
            "name": watchlist.name,
            "stock_count": len(watchlist.stocks)
        }
        for watchlist in watchlists
    ]


@app.post("/watchlists")
def create_watchlist(
    data: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    name = data.get("name")

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Watchlist name is required"
        )

    watchlist = Watchlist(
        name=name,
        user_id=user.id
    )

    db.add(watchlist)
    db.commit()
    db.refresh(watchlist)

    return {
        "id": watchlist.id,
        "name": watchlist.name
    }


@app.put("/watchlists/{watchlist_id}")
def update_watchlist(
    watchlist_id: int,
    data: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    watchlist = db.query(Watchlist).filter(
        and_(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user.id
        )
    ).first()

    if not watchlist:
        raise HTTPException(
            status_code=404,
            detail="Watchlist not found"
        )

    name = data.get("name")

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Watchlist name is required"
        )

    watchlist.name = name

    db.commit()
    db.refresh(watchlist)

    return {
        "id": watchlist.id,
        "name": watchlist.name
    }


@app.delete("/watchlists/{watchlist_id}")
def delete_watchlist(
    watchlist_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    watchlist = db.query(Watchlist).filter(
        and_(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user.id
        )
    ).first()

    if not watchlist:
        raise HTTPException(
            status_code=404,
            detail="Watchlist not found"
        )

    db.delete(watchlist)
    db.commit()

    return {
        "message": "Watchlist deleted"
    }


@app.get("/watchlists/{watchlist_id}/stocks")
def get_watchlist_stocks(
    watchlist_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    watchlist = db.query(Watchlist).filter(
        and_(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user.id
        )
    ).first()

    if not watchlist:
        raise HTTPException(
            status_code=404,
            detail="Watchlist not found"
        )

    return [
        {
            "id": stock.id,
            "symbol": stock.symbol,
            "priority": stock.priority
        }
        for stock in watchlist.stocks
    ]


@app.post("/watchlists/{watchlist_id}/stocks")
async def add_stock(
    watchlist_id: int,
    data: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    watchlist = db.query(Watchlist).filter(
        and_(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user.id
        )
    ).first()

    if not watchlist:
        raise HTTPException(
            status_code=404,
            detail="Watchlist not found"
        )

    symbol = data.get("symbol")

    if not symbol:
        raise HTTPException(
            status_code=400,
            detail="Stock symbol is required"
        )

    symbol = symbol.upper().strip()

    existing = db.query(WatchlistStock).filter(
        and_(
            WatchlistStock.watchlist_id == watchlist_id,
            WatchlistStock.symbol == symbol
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Stock already exists"
        )

    market = await get_stock(symbol)

    if not market:
        raise HTTPException(
            status_code=404,
            detail="Stock not found"
        )

    stock = WatchlistStock(
        symbol=symbol,
        watchlist_id=watchlist_id
    )

    db.add(stock)
    db.commit()
    db.refresh(stock)

    return {
        "id": stock.id,
        "symbol": stock.symbol
    }


@app.delete(
    "/watchlists/{watchlist_id}/stocks/{symbol}"
)
def remove_stock(
    watchlist_id: int,
    symbol: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stock = db.query(WatchlistStock).join(
        Watchlist
    ).filter(
        and_(
            WatchlistStock.watchlist_id == watchlist_id,
            WatchlistStock.symbol == symbol.upper(),
            Watchlist.user_id == user.id
        )
    ).first()

    if not stock:
        raise HTTPException(
            status_code=404,
            detail="Stock not found"
        )

    db.delete(stock)
    db.commit()

    return {
        "message": "Stock removed"
    }


@app.get("/stocks/{symbol}")
async def stock_details(
    symbol: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    market = await get_stock(symbol)

    if not market:
        raise HTTPException(
            status_code=404,
            detail="Stock not found"
        )

    observation = db.query(Observation).filter(
        and_(
            Observation.user_id == user.id,
            Observation.symbol == symbol.upper()
        )
    ).first()

    previous_price = None
    previous_volume = None
    last_checked = None

    if observation:
        previous_price = observation.price
        previous_volume = observation.volume
        last_checked = observation.checked_at

    change = calculate_change(
        market["price"],
        previous_price,
        market["volume"],
        previous_volume
    )

    return {
        "symbol": market["symbol"],
        "name": market["name"],
        "price": market["price"],
        "volume": market["volume"],
        "currency": market["currency"],
        "market": market["market"],
        "price_change": change["price_change"],
        "volume_change": change["volume_change"],
        "score": change["score"],
        "severity": change["severity"],
        "reason": change["reason"],
        "last_checked": (
            last_checked.isoformat()
            if last_checked
            else None
        ),
        "updated_at": market["updated_at"],
        "source": market["source"],
        "stale": market["stale"]
    }


@app.get("/watchlists/{watchlist_id}/changes")
async def get_changes(
    watchlist_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    watchlist = db.query(Watchlist).filter(
        and_(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user.id
        )
    ).first()

    if not watchlist:
        raise HTTPException(
            status_code=404,
            detail="Watchlist not found"
        )

    results = []

    for item in watchlist.stocks:
        market = await get_stock(item.symbol)

        if not market:
            continue

        observation = db.query(Observation).filter(
            and_(
                Observation.user_id == user.id,
                Observation.symbol == item.symbol
            )
        ).first()

        previous_price = None
        previous_volume = None
        last_checked = None

        if observation:
            previous_price = observation.price
            previous_volume = observation.volume
            last_checked = observation.checked_at

        change = calculate_change(
            market["price"],
            previous_price,
            market["volume"],
            previous_volume
        )

        results.append({
            "symbol": market["symbol"],
            "name": market["name"],
            "price": market["price"],
            "volume": market["volume"],
            "price_change": change["price_change"],
            "volume_change": change["volume_change"],
            "score": change["score"],
            "severity": change["severity"],
            "reason": change["reason"],
            "last_checked": (
                last_checked.isoformat()
                if last_checked
                else None
            ),
            "updated_at": market["updated_at"],
            "source": market["source"],
            "stale": market["stale"]
        })

    results.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return results


@app.post("/watchlists/{watchlist_id}/check")
async def check_watchlist(
    watchlist_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    watchlist = db.query(Watchlist).filter(
        and_(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user.id
        )
    ).first()

    if not watchlist:
        raise HTTPException(
            status_code=404,
            detail="Watchlist not found"
        )

    results = []

    for item in watchlist.stocks:
        market = await get_stock(item.symbol)

        if not market:
            continue

        observation = db.query(Observation).filter(
            and_(
                Observation.user_id == user.id,
                Observation.symbol == item.symbol
            )
        ).first()

        previous_price = None
        previous_volume = None
        last_checked = None

        if observation:
            previous_price = observation.price
            previous_volume = observation.volume
            last_checked = observation.checked_at

        change = calculate_change(
            market["price"],
            previous_price,
            market["volume"],
            previous_volume
        )

        results.append({
            "symbol": market["symbol"],
            "name": market["name"],
            "price": market["price"],
            "volume": market["volume"],
            "price_change": change["price_change"],
            "volume_change": change["volume_change"],
            "score": change["score"],
            "severity": change["severity"],
            "reason": change["reason"],
            "last_checked": (
                last_checked.isoformat()
                if last_checked
                else None
            ),
            "updated_at": market["updated_at"],
            "source": market["source"],
            "stale": market["stale"]
        })

        if observation:
            observation.price = market["price"]
            observation.volume = market["volume"]
            observation.score = change["score"]
        else:
            observation = Observation(
                user_id=user.id,
                symbol=item.symbol,
                price=market["price"],
                volume=market["volume"],
                score=change["score"]
            )

            db.add(observation)

    db.commit()

    results.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return {
        "message": "Watchlist checked",
        "stocks_checked": len(results),
        "changes": results
    }