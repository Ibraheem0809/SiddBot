import os

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

from rag.loader import load_document
from rag.chunker import create_chunks
from rag.embedding import create_embedding


load_dotenv()


# ==============================
# QDRANT CONFIG
# ==============================

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

COLLECTION_NAME = "personal_knowledge"


# ==============================
# CONNECT TO QDRANT
# ==============================

print("Connecting to Qdrant...")

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)

print("Connected to Qdrant!")


# ==============================
# RECREATE COLLECTION
# ==============================

if client.collection_exists(COLLECTION_NAME):

    print(f"Deleting existing collection: {COLLECTION_NAME}")

    client.delete_collection(COLLECTION_NAME)

    print("Old collection deleted.")


print(f"Creating collection: {COLLECTION_NAME}")

client.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=VectorParams(
        size=384,
        distance=Distance.COSINE
    )
)

print("Collection created!")


# ==============================
# LOAD DOCUMENT
# ==============================

print("\nLoading personal information...")

text = load_document(
    "data/personal_info.txt"
)

print("Document loaded.")


# ==============================
# CREATE CHUNKS
# ==============================

chunks = create_chunks(text)

print(f"\nCreated {len(chunks)} chunks.")


# ==============================
# CREATE EMBEDDINGS
# ==============================

points = []

print("\nCreating embeddings...")

for i, chunk in enumerate(chunks):

    print(f"Embedding chunk {i + 1}/{len(chunks)}...")

    vector = create_embedding(chunk)

    point = PointStruct(
        id=i + 1,
        vector=vector.tolist(),
        payload={
            "text": chunk,
            "chunk_id": i + 1
        }
    )

    points.append(point)


# ==============================
# UPLOAD TO QDRANT
# ==============================

print("\nUploading points to Qdrant...")

client.upsert(
    collection_name=COLLECTION_NAME,
    points=points
)

print(f"\nSuccessfully uploaded {len(points)} chunks!")


# ==============================
# VERIFY
# ==============================

collection_info = client.get_collection(
    COLLECTION_NAME
)

print("\n--- COLLECTION INFO ---")
print(f"Collection: {COLLECTION_NAME}")
print(f"Vectors: {collection_info.points_count}")

print("\nRAG knowledge base is ready!")