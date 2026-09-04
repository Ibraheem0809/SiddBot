from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")


def create_embedding(text):
    return model.encode(text)

########## Testing ##########

text = "Ibraheem knows Python and Java."

embedding = create_embedding(text)

print("Vector:", embedding)
print("Vector size:", len(embedding))