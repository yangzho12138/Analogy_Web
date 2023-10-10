import mongoose from "mongoose";

interface ConceptAttrs {
    name: string;
    // status: boolean; // false - not selected, true - selected
}

interface ConceptDoc extends mongoose.Document {
    name: string;
    status: boolean;
    userId: string;
}

interface ConceptModel extends mongoose.Model<ConceptDoc> {
    build(attrs: ConceptAttrs): ConceptDoc;
}

const ConceptSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        status: {
            type: Boolean,
            required: true,
            default: false,
        },
        userId: {
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

ConceptSchema.statics.build = (attrs: ConceptAttrs) => {
    return new Concept(attrs);
};

const Concept = mongoose.model<ConceptDoc, ConceptModel>(
    "Concept",
    ConceptSchema
);

export { Concept };