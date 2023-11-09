import mongoose from "mongoose";

export interface SearchRecordAttrs {
  // searchHistoryId: string;
  tag: string;
  isRelevant: number;
  url: string;
}

interface SearchRecordModel extends mongoose.Model<SearchRecordDoc> {
  build(attrs: SearchRecordAttrs): SearchRecordDoc;
}

interface SearchRecordDoc extends mongoose.Document {
  searchHistoryId: string;
  tag: string;
  isRelevant: number;
  url: string;
  isPreSet: boolean;
  preSetVal: boolean; // postive or negative
}

const SearchRecordSchema = new mongoose.Schema(
  {
    searchHistoryId: {
      type: String,
      required: false,
    },
    tag: {
      type: String,
      required: true,
    },
    isRelevant: {
      type: Number,
      required: true,
      default: 0,
    },
    url: {
      type: String,
      required: true,
    },
    isPreSet: {
      type: Boolean,
      required: true,
      default: false,
    },
    preSetVal: {
      type: Boolean,
      required: false,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret.__v;
        delete ret._id;
      },
    },
  }
);

SearchRecordSchema.statics.build = (attrs: SearchRecordAttrs) => {
  return new SearchRecord(attrs);
};

const SearchRecord = mongoose.model<SearchRecordDoc, SearchRecordModel>(
  "SearchRecord",
  SearchRecordSchema
);

export { SearchRecord };
