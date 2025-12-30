import mongoose from "mongoose";

const areaSchema = new mongoose.Schema(
  {
    nombre: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },
    descripcion: { 
      type: String, 
      trim: true, 
      default: "" 
    },
    activa: { 
      type: Boolean, 
      default: true 
    },
  },
  { timestamps: true }
);

export default mongoose.model("Area", areaSchema);
