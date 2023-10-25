import mongoose from "mongoose";

interface TestCaseAttrs {
    url: string;
}

interface TestCaseModel extends mongoose.Model<TestCaseDoc> {
    build(attrs: TestCaseAttrs): TestCaseDoc;
}

interface TestCaseDoc extends mongoose.Document {
    url: string;
    labeled: boolean;
    label: boolean; // for test cases given the related tag
    userIds: string[]; // users already tested this test case
}

const TestCaseSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    labeled: {
        type: Boolean,
        required: true,
        default: false
    },
    label: {
        type: Boolean,
        required: false,
        default: false
    },
    userIds: {
        type: [String],
        required: false,
        default: []
    }
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret.__v;
            delete ret._id;
        }
    }
});

TestCaseSchema.statics.build = (attrs: TestCaseAttrs) => {
    return new TestCase(attrs);
};

const TestCase = mongoose.model<TestCaseDoc, TestCaseModel>('TestCase', TestCaseSchema);

export { TestCase };