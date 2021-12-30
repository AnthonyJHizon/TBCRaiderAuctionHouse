const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  _id: Number,
  name: {
    type: String,
    required: true,
  },
  levelReq: {
    type: Number,
    required: true,
  },
  itemLevel: {
    type: Number,
    required: true,
  },
  itemClass: {
    type: String,
    required: true,
  },
  itemSubclass: {
    type: String,
    required: true,
  },
  itemEquip: {
    type: String,
    required: true,
  },
  itemQuality: {
    type: String,
    required: true,
  },
  iconURL: {
    type: String,
    require: true,
  }
})

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;