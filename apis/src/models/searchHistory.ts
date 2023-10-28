import mongoose from "mongoose";

export interface SearchHistoryAttrs {
  userId: string;
  searchKeyword: string;
  tag: string;
  concept: string;
  searchRecordIds: string[];
}

interface SearchHistoryModel extends mongoose.Model<SearchHistoryDoc> {
  build(attrs: SearchHistoryAttrs): SearchHistoryDoc;
}

interface SearchHistoryDoc extends mongoose.Document {
  userId: string;
  searchKeyword: string;
  tag: string;
  concept: string;
  searchRecordIds: string[];
  submitted: boolean;
  link: string;
}

const SearchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    searchKeyword: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      required: true,
    },
    concept: {
      type: String,
      required: false,
    },
    searchRecordIds: {
      type: [String],
      required: false,
    },
    submitted: {
      type: Boolean,
      required: true,
      default: false,
    },
    link: {
      type: String,
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

SearchHistorySchema.statics.build = (attrs: SearchHistoryAttrs) => {
  return new SearchHistory(attrs);
};

const SearchHistory = mongoose.model<SearchHistoryDoc, SearchHistoryModel>(
  "SearchHistory",
  SearchHistorySchema
);

export { SearchHistory };