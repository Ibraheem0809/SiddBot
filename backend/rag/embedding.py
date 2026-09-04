from sentence_transformers import SentenceTransformer


# --------------------------------------------------
# LOAD EMBEDDING MODEL
# --------------------------------------------------

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


# --------------------------------------------------
# CREATE EMBEDDING
# --------------------------------------------------

def create_embedding(text):
    """
    Convert text into an embedding vector.
    """

    return model.encode(text)