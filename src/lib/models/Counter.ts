import { Schema, model, models } from "mongoose";

const CounterSchema = new Schema({
  key: { type: String, unique: true },
  seq: { type: Number, default: 0 },
});

export default models.Counter || model("Counter", CounterSchema);
