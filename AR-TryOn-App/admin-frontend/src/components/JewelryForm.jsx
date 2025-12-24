import { useState } from "react";
import API from "../services/api";

export default function JewelryForm() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Necklace");
  const [image, setImage] = useState(null);

  const submit = async (e) => {
    e.preventDefault();

    if (!image) return alert("Please select image");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("image", image);

    await API.post("/jewelry", formData);
    alert("Jewelry uploaded & 3D generation started");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        className="border p-2 w-full"
        placeholder="Jewelry Name"
        onChange={(e) => setName(e.target.value)}
        required
      />

      <select
        className="border p-2 w-full"
        onChange={(e) => setCategory(e.target.value)}
      >
        <option>Necklace</option>
        <option>Earring</option>
        <option>Nosepin</option>
      </select>

      <input
        type="file"
        accept="image/png,image/jpeg"
        onChange={(e) => setImage(e.target.files[0])}
      />

      <button className="bg-green-600 text-white px-4 py-2">
        Upload Jewelry
      </button>
    </form>
  );
}
