import asyncio
from pymongo import AsyncMongoClient
from app.config import settings

async def main():
    client = AsyncMongoClient(
        settings.MONGO_URI,
        tlsAllowInvalidCertificates=True,
    )
    db = client[settings.MONGO_DB_NAME]
    print(f"Connecting to database: {settings.MONGO_DB_NAME}")
    
    users = await db["users"].find().to_list(length=100)
    print(f"Total users found: {len(users)}")
    for user in users:
        print(f"- Name: {user.get('name')}, Email: {user.get('email')}, Created At: {user.get('created_at')}")

if __name__ == "__main__":
    asyncio.run(main())
