def load_document(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        text = file.read()

    return text


########## Testing ##########

text = load_document("data/personal_info.txt")

print(text)