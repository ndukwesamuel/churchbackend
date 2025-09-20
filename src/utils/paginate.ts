import type { Document, Model } from "mongoose";

interface PaginateOptions<T extends Document> {
  model: Model<T>;
  query?: Record<string, any>;
  page?: number;
  limit?: number;
  sort?: Record<string, any>;
  populateOptions?: any[];
  select?: string[];
  excludeById?: string | null;
  excludeField?: string;
  projection?: Record<string, 1>;
}

interface PaginateResult<T> {
  documents: T[];
  pagination: {
    totalCount: number;
    filteredCount: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export const paginate = async <T extends Document>({
  model,
  query = {},
  page = 1,
  limit = 10,
  sort = { createdAt: -1 },
  populateOptions = [],
  select = [],
  excludeById = null,
  excludeField = "_id",
  projection = {},
}: PaginateOptions<T>): Promise<PaginateResult<T>> => {
  const skip = (page - 1) * limit;

  if (excludeById !== null) {
    query[excludeField] = { $ne: excludeById };
  }

  let queryBuilder = model
    .find(query, projection)
    .skip(skip)
    .limit(limit)
    .sort(sort)
    .select(select);

  populateOptions.forEach((option) => {
    queryBuilder = queryBuilder.populate(option);
  });

  const documents = await queryBuilder;

  const totalCount = await model.countDocuments();
  const filteredCount = await model.countDocuments(query);
  const totalPages = Math.ceil(filteredCount / limit);

  return {
    documents,
    pagination: {
      totalCount,
      filteredCount,
      totalPages,
      page,
      limit,
    },
  };
};
