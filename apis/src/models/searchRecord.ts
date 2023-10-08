import mongoose from "mongoose";

interface SearchRecordAttrs {
  searchHistoryId: string;
  tag: string; // Bing / GPT
  isRelevant: number; // 
  title: string;
  url: string;
}

interface SearchRecordModel extends mongoose.Model<SearchRecordDoc> {
  build(attrs: SearchRecordAttrs): SearchRecordDoc;
}

interface SearchRecordDoc extends mongoose.Document {
  searchHistoryId: string;
  tag: string;
  isRelevant: number;
  title: string;
  url: string;
}

const SearchRecordSchema = new mongoose.Schema(
  {
    searchHistoryId: {
      type: String,
      required: true,
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
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
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
