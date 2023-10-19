import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";
import { calculateBoundingBox, calculateDistance } from "../libs/geocalc.ts";
import { JSONStream } from "../libs/streamJsonFile.ts";

// Define the path to the SQLite database file.
const dbPath = "your-database.db";
const tableName = "address";

// Define a function to import the JSON data into SQLite.
export async function prepareDB() {
  // Open a database
  const db = new DB(dbPath);

  db.execute(`CREATE TABLE IF NOT EXISTS ${tableName} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guid TEXT UNIQUE,
    isActive BOOLEAN,
    address TEXT,
    latitude REAL,
    longitude REAL,
    tags TEXT
  )`);
  // Insert data into the table.
  // Split jsonData into chunks of 1000 for batch insertion.
  await new Promise((resolve) => {
    const stream = new JSONStream("./addresses.json", 1000);
    stream.on("batch", (array: Address[]) => {
      // Create the SQL statement with multiple sets of values.
      const placeholders = Array(array.length)
        .fill(null)
        .map(() => "(?, ?, ?, ?, ?, ?, ?)")
        .join(", ");
      const values = array.flatMap((item) => [
        null,
        item.guid,
        item.isActive ? 1 : 0,
        item.address,
        item.latitude,
        item.longitude,
        JSON.stringify(item.tags),
      ]);
      const sql = `INSERT INTO ${tableName} VALUES ${placeholders}`;

      // Insert data into the table for the current chunk.
      try {
        db.query(sql, values);
      } catch (_error) {
        //console.log(_error);
      }
    });
    stream.on("end", () => resolve(true));
  });

  const count = db.query(`SELECT count(*) FROM ${tableName}`);
  console.log(`Inserted ${count} rows of data.`);

  db.close();
}

export function getByGuid(searchGuid: string) {
  const sql = `SELECT * FROM ${tableName} WHERE guid = :guid;`;
  const values = { guid: searchGuid };

  const db = new DB(dbPath);
  const [result] = db.queryEntries<RepositoryAddress>(sql, values);
  db.close();

  return parseToCity(result);
}

export function getByTag(tag: string, isActive: boolean) {
  const sql = `SELECT * FROM ${tableName} WHERE isActive = ? AND tags LIKE ?`;
  const values = [isActive, `%${tag}%`];

  const db = new DB(dbPath);
  const results = db.queryEntries<RepositoryAddress>(sql, values);
  db.close();

  return results.map(parseToCity);
}

type Coordinates = {
  latitude: number;
  longitude: number;
};
export function getByGeoBoundingBox(from: Coordinates, to: Coordinates) {
  const sql = `
    SELECT *
    FROM ${tableName}
    WHERE latitude BETWEEN MIN(:fromLat, :toLat) AND MAX(:fromLat, :toLat)
      AND longitude BETWEEN MIN(:fromLon, :toLon) AND MAX(:fromLon, :toLon);`;
  const values = {
    fromLat: from.latitude,
    toLat: to.latitude,
    fromLon: from.longitude,
    toLon: to.longitude,
  };

  const db = new DB(dbPath);
  const results = db.queryEntries<RepositoryAddress>(sql, values);
  db.close();
  return results.map(parseToCity);
}

export function getByGeoCircle(
  from: Coordinates,
  radius: number,
  unit: "km" | "miles" = "km"
) {
  const boundingBoxCoordinates = calculateBoundingBox(from, radius, unit);

  const boundingBoxEntries = getByGeoBoundingBox(
    boundingBoxCoordinates.from,
    boundingBoxCoordinates.to
  );

  const results = boundingBoxEntries.filter(({ latitude, longitude }) => {
    const distance = calculateDistance(from, { latitude, longitude }, unit);
    return distance <= radius;
  });

  return results;
}

export function getList(
  limit: number,
  cursor = 0
): { data: Address[]; cursor: number } {
  const sql = `
    SELECT * FROM your_table
    WHERE id > :cursor
    LIMIT :limit;
  `;
  const values = { limit, cursor };

  const db = new DB(dbPath);
  const results = db.queryEntries<RepositoryAddress>(sql, values);
  db.close();

  const lastId = results.length ? results[results.length - 1].id : cursor;

  return { data: results.map(parseToCity), cursor: lastId };
}

function parseToCity(row: RepositoryAddress) {
  return {
    guid: row.guid,
    isActive: !!row.isActive,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    tags: JSON.parse(row.tags),
  };
}

type Address = {
  guid: string;
  isActive: boolean;
  address: string;
  latitude: number;
  longitude: number;
  tags: string[];
};

type RepositoryAddress = {
  id: number;
  guid: string;
  isActive: number;
  address: string;
  latitude: number;
  longitude: number;
  tags: string;
};
