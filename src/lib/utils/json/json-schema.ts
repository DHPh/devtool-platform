/**
 * JSON Schema Validation Utilities
 * Provides basic JSON Schema validation functionality
 */

export interface SchemaValidationResult {
  isValid: boolean;
  errors: SchemaError[];
  warnings: string[];
}

export interface SchemaError {
  path: string;
  message: string;
  schemaPath: string;
  value: unknown;
}

export interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema | JsonSchema[];
  required?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: unknown[];
  format?: string;
  additionalProperties?: boolean | JsonSchema;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  multipleOf?: number;
  const?: unknown;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  not?: JsonSchema;
  if?: JsonSchema;
  then?: JsonSchema;
  else?: JsonSchema;
  title?: string;
  description?: string;
  default?: unknown;
  examples?: unknown[];
  $schema?: string;
  $id?: string;
  $ref?: string;
}

/**
 * Validate JSON data against a schema
 */
export function validateJsonSchema(
  data: unknown,
  schema: JsonSchema
): SchemaValidationResult {
  const errors: SchemaError[] = [];
  const warnings: string[] = [];

  validateRecursive(data, schema, "$", "$", errors, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Recursive validation function
 */
function validateRecursive(
  data: unknown,
  schema: JsonSchema,
  dataPath: string,
  schemaPath: string,
  errors: SchemaError[],
  warnings: string[]
): void {
  // Handle schema references (basic implementation)
  if (schema.$ref) {
    warnings.push(`Schema reference ${schema.$ref} not resolved`);
    return;
  }

  // Handle composite schemas
  if (schema.allOf) {
    schema.allOf.forEach((subSchema, index) => {
      validateRecursive(
        data,
        subSchema,
        dataPath,
        `${schemaPath}/allOf/${index}`,
        errors,
        warnings
      );
    });
    return;
  }

  if (schema.anyOf) {
    const tempErrors: SchemaError[] = [];
    let validCount = 0;

    schema.anyOf.forEach((subSchema, index) => {
      const subErrors: SchemaError[] = [];
      validateRecursive(
        data,
        subSchema,
        dataPath,
        `${schemaPath}/anyOf/${index}`,
        subErrors,
        warnings
      );
      if (subErrors.length === 0) {
        validCount++;
      } else {
        tempErrors.push(...subErrors);
      }
    });

    if (validCount === 0) {
      errors.push(...tempErrors);
    }
    return;
  }

  if (schema.oneOf) {
    const tempErrors: SchemaError[] = [];
    let validCount = 0;

    schema.oneOf.forEach((subSchema, index) => {
      const subErrors: SchemaError[] = [];
      validateRecursive(
        data,
        subSchema,
        dataPath,
        `${schemaPath}/oneOf/${index}`,
        subErrors,
        warnings
      );
      if (subErrors.length === 0) {
        validCount++;
      } else {
        tempErrors.push(...tempErrors);
      }
    });

    if (validCount !== 1) {
      if (validCount === 0) {
        errors.push({
          path: dataPath,
          message: "Data does not match any of the oneOf schemas",
          schemaPath,
          value: data,
        });
      } else {
        errors.push({
          path: dataPath,
          message: `Data matches ${validCount} of the oneOf schemas, but should match exactly one`,
          schemaPath,
          value: data,
        });
      }
    }
    return;
  }

  if (schema.not) {
    const notErrors: SchemaError[] = [];
    validateRecursive(
      data,
      schema.not,
      dataPath,
      `${schemaPath}/not`,
      notErrors,
      warnings
    );
    if (notErrors.length === 0) {
      errors.push({
        path: dataPath,
        message: "Data matches the not schema, but it should not",
        schemaPath,
        value: data,
      });
    }
    return;
  }

  // Handle const
  if ("const" in schema) {
    if (!deepEqual(data, schema.const)) {
      errors.push({
        path: dataPath,
        message: `Expected const value ${JSON.stringify(schema.const)}`,
        schemaPath: `${schemaPath}/const`,
        value: data,
      });
    }
    return;
  }

  // Handle enum
  if (schema.enum) {
    if (!schema.enum.some((enumValue) => deepEqual(data, enumValue))) {
      errors.push({
        path: dataPath,
        message: `Value must be one of: ${schema.enum
          .map((v) => JSON.stringify(v))
          .join(", ")}`,
        schemaPath: `${schemaPath}/enum`,
        value: data,
      });
    }
  }

  // Type validation
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const dataType = getJsonType(data);

    if (!types.includes(dataType)) {
      errors.push({
        path: dataPath,
        message: `Expected type ${types.join(" or ")}, got ${dataType}`,
        schemaPath: `${schemaPath}/type`,
        value: data,
      });
      return; // Don't continue validation if type is wrong
    }
  }

  // Type-specific validations
  switch (getJsonType(data)) {
    case "string":
      validateString(data as string, schema, dataPath, schemaPath, errors);
      break;
    case "number":
    case "integer":
      validateNumber(data as number, schema, dataPath, schemaPath, errors);
      break;
    case "array":
      validateArray(
        data as unknown[],
        schema,
        dataPath,
        schemaPath,
        errors,
        warnings
      );
      break;
    case "object":
      validateObject(
        data as Record<string, unknown>,
        schema,
        dataPath,
        schemaPath,
        errors,
        warnings
      );
      break;
  }
}

/**
 * Validate string values
 */
function validateString(
  value: string,
  schema: JsonSchema,
  dataPath: string,
  schemaPath: string,
  errors: SchemaError[]
): void {
  if (typeof schema.minLength === "number" && value.length < schema.minLength) {
    errors.push({
      path: dataPath,
      message: `String length ${value.length} is less than minimum ${schema.minLength}`,
      schemaPath: `${schemaPath}/minLength`,
      value,
    });
  }

  if (typeof schema.maxLength === "number" && value.length > schema.maxLength) {
    errors.push({
      path: dataPath,
      message: `String length ${value.length} is greater than maximum ${schema.maxLength}`,
      schemaPath: `${schemaPath}/maxLength`,
      value,
    });
  }

  if (schema.pattern) {
    try {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push({
          path: dataPath,
          message: `String does not match pattern ${schema.pattern}`,
          schemaPath: `${schemaPath}/pattern`,
          value,
        });
      }
    } catch {
      errors.push({
        path: dataPath,
        message: `Invalid regex pattern in schema: ${schema.pattern}`,
        schemaPath: `${schemaPath}/pattern`,
        value,
      });
    }
  }

  if (schema.format) {
    validateStringFormat(value, schema.format, dataPath, schemaPath, errors);
  }
}

/**
 * Validate number values
 */
function validateNumber(
  value: number,
  schema: JsonSchema,
  dataPath: string,
  schemaPath: string,
  errors: SchemaError[]
): void {
  if (typeof schema.minimum === "number" && value < schema.minimum) {
    errors.push({
      path: dataPath,
      message: `Value ${value} is less than minimum ${schema.minimum}`,
      schemaPath: `${schemaPath}/minimum`,
      value,
    });
  }

  if (typeof schema.maximum === "number" && value > schema.maximum) {
    errors.push({
      path: dataPath,
      message: `Value ${value} is greater than maximum ${schema.maximum}`,
      schemaPath: `${schemaPath}/maximum`,
      value,
    });
  }

  if (typeof schema.multipleOf === "number") {
    if (value % schema.multipleOf !== 0) {
      errors.push({
        path: dataPath,
        message: `Value ${value} is not a multiple of ${schema.multipleOf}`,
        schemaPath: `${schemaPath}/multipleOf`,
        value,
      });
    }
  }
}

/**
 * Validate array values
 */
function validateArray(
  value: unknown[],
  schema: JsonSchema,
  dataPath: string,
  schemaPath: string,
  errors: SchemaError[],
  warnings: string[]
): void {
  if (typeof schema.minItems === "number" && value.length < schema.minItems) {
    errors.push({
      path: dataPath,
      message: `Array length ${value.length} is less than minimum ${schema.minItems}`,
      schemaPath: `${schemaPath}/minItems`,
      value,
    });
  }

  if (typeof schema.maxItems === "number" && value.length > schema.maxItems) {
    errors.push({
      path: dataPath,
      message: `Array length ${value.length} is greater than maximum ${schema.maxItems}`,
      schemaPath: `${schemaPath}/maxItems`,
      value,
    });
  }

  if (schema.uniqueItems) {
    const seen = new Set();
    value.forEach((item, index) => {
      const itemStr = JSON.stringify(item);
      if (seen.has(itemStr)) {
        errors.push({
          path: `${dataPath}[${index}]`,
          message: "Array items must be unique",
          schemaPath: `${schemaPath}/uniqueItems`,
          value: item,
        });
      }
      seen.add(itemStr);
    });
  }

  // Validate items
  if (schema.items) {
    if (Array.isArray(schema.items)) {
      // Tuple validation
      schema.items.forEach((itemSchema, index) => {
        if (index < value.length) {
          validateRecursive(
            value[index],
            itemSchema,
            `${dataPath}[${index}]`,
            `${schemaPath}/items/${index}`,
            errors,
            warnings
          );
        }
      });
    } else {
      // All items same schema
      value.forEach((item, index) => {
        validateRecursive(
          item,
          schema.items as JsonSchema,
          `${dataPath}[${index}]`,
          `${schemaPath}/items`,
          errors,
          warnings
        );
      });
    }
  }
}

/**
 * Validate object values
 */
function validateObject(
  value: Record<string, unknown>,
  schema: JsonSchema,
  dataPath: string,
  schemaPath: string,
  errors: SchemaError[],
  warnings: string[]
): void {
  // Required properties
  if (schema.required) {
    schema.required.forEach((requiredProp) => {
      if (!(requiredProp in value)) {
        errors.push({
          path: dataPath,
          message: `Missing required property '${requiredProp}'`,
          schemaPath: `${schemaPath}/required`,
          value,
        });
      }
    });
  }

  // Validate properties
  if (schema.properties) {
    Object.entries(value).forEach(([key, val]) => {
      if (key in schema.properties!) {
        validateRecursive(
          val,
          schema.properties![key],
          `${dataPath}.${key}`,
          `${schemaPath}/properties/${key}`,
          errors,
          warnings
        );
      } else if (schema.additionalProperties === false) {
        errors.push({
          path: `${dataPath}.${key}`,
          message: "Additional property not allowed",
          schemaPath: `${schemaPath}/additionalProperties`,
          value: val,
        });
      } else if (typeof schema.additionalProperties === "object") {
        validateRecursive(
          val,
          schema.additionalProperties,
          `${dataPath}.${key}`,
          `${schemaPath}/additionalProperties`,
          errors,
          warnings
        );
      }
    });
  }
}

/**
 * Validate string formats
 */
function validateStringFormat(
  value: string,
  format: string,
  dataPath: string,
  schemaPath: string,
  errors: SchemaError[]
): void {
  const formatValidators: Record<string, RegExp> = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    uri: /^https?:\/\/.+/,
    "date-time":
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)$/,
    date: /^\d{4}-\d{2}-\d{2}$/,
    time: /^\d{2}:\d{2}:\d{2}$/,
    ipv4: /^(\d{1,3}\.){3}\d{1,3}$/,
    ipv6: /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
    uuid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i,
  };

  const validator = formatValidators[format];
  if (validator && !validator.test(value)) {
    errors.push({
      path: dataPath,
      message: `String does not match format '${format}'`,
      schemaPath: `${schemaPath}/format`,
      value,
    });
  } else if (!validator) {
    errors.push({
      path: dataPath,
      message: `Unknown format '${format}'`,
      schemaPath: `${schemaPath}/format`,
      value,
    });
  }
}

/**
 * Get JSON Schema type for a value
 */
function getJsonType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "number";
  }
  return typeof value;
}

/**
 * Deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  return false;
}

/**
 * Generate basic schema from JSON data
 */
export function generateSchemaFromData(data: unknown): JsonSchema {
  const schema: JsonSchema = {};

  if (data === null) {
    schema.type = "null";
  } else if (Array.isArray(data)) {
    schema.type = "array";
    if (data.length > 0) {
      // Try to infer item schema from first item
      schema.items = generateSchemaFromData(data[0]);
    }
    schema.minItems = 0;
  } else if (typeof data === "object") {
    schema.type = "object";
    schema.properties = {};
    schema.required = [];

    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      schema.properties![key] = generateSchemaFromData(value);
      schema.required!.push(key);
    });

    schema.additionalProperties = false;
  } else if (typeof data === "string") {
    schema.type = "string";

    // Try to detect common formats
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
      schema.format = "email";
    } else if (/^https?:\/\/.+/.test(data)) {
      schema.format = "uri";
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)) {
      schema.format = "date-time";
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      schema.format = "date";
    } else if (
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(
        data
      )
    ) {
      schema.format = "uuid";
    }
  } else if (typeof data === "number") {
    schema.type = Number.isInteger(data) ? "integer" : "number";
  } else if (typeof data === "boolean") {
    schema.type = "boolean";
  }

  return schema;
}
