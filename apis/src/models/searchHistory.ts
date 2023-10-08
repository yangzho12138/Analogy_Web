import mongoose from "mongoose";

interface SearchHistoryAttrs {
  userId: string;
  searchKeyword: string;
  tag: string;
  searchRecordIds: string[];
}

interface SearchHistoryModel extends mongoose.Model<SearchHistoryDoc> {
  build(attrs: SearchHistoryAttrs): SearchHistoryDoc;
}

interface SearchHistoryDoc extends mongoose.Document {
  userId: string;
  searchKeyword: string;
  tag: string;
  searchRecordIds: string[];
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
    searchRecordIds: {
      type: [String],
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