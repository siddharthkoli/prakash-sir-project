-- Migration: add region/district lookup support, effective address fields, and trigger
-- This script is safe to run multiple times; it checks for existing columns/trigger
-- and backfills any existing rows.  Execute it after the UserInquiry table exists.

/* add new columns only if missing */
IF COL_LENGTH('UserInquiry','region') IS NULL
BEGIN
    ALTER TABLE UserInquiry ADD region nvarchar(100) NULL;
END;

IF COL_LENGTH('UserInquiry','district') IS NULL
BEGIN
    ALTER TABLE UserInquiry ADD district nvarchar(100) NULL;
END;

IF COL_LENGTH('UserInquiry','effective_city') IS NULL
BEGIN
    ALTER TABLE UserInquiry
      ADD effective_city AS (CASE WHEN lodge_city IS NOT NULL AND lodge_city <> '' THEN lodge_city ELSE city END) PERSISTED;
END;

IF COL_LENGTH('UserInquiry','effective_state') IS NULL
BEGIN
    ALTER TABLE UserInquiry
      ADD effective_state AS (CASE WHEN lodge_state IS NOT NULL AND lodge_state <> '' THEN lodge_state ELSE state END) PERSISTED;
END;

IF COL_LENGTH('UserInquiry','effective_county') IS NULL
BEGIN
    ALTER TABLE UserInquiry
      ADD effective_county AS (CASE WHEN lodge_county IS NOT NULL AND lodge_county <> '' THEN lodge_county ELSE county END) PERSISTED;
END;

/* backfill existing rows using the same county→district/region logic */
BEGIN TRY
    UPDATE ui
    SET
        district = d.district_name,
        region   = r.region_name,
        allocated_lodge_id = COALESCE(ui.allocated_lodge_id,
            (
                SELECT TOP 1 id
                FROM Lodges
                WHERE district_id = c.district_id
                ORDER BY id
            )
        )
    FROM UserInquiry ui
    LEFT JOIN county c ON c.county_name = COALESCE(NULLIF(ui.lodge_county,'') , ui.county)
    LEFT JOIN Districts d ON d.id = c.district_id
    LEFT JOIN Regions r ON r.id = d.region_id;
END TRY
BEGIN CATCH
    -- if lookup tables are missing, skip the update
END CATCH;

/* create trigger if it doesn't already exist */
IF OBJECT_ID('trg_UserInquiry_LocationMap','TR') IS NULL
AND OBJECT_ID('county') IS NOT NULL
AND OBJECT_ID('Districts') IS NOT NULL
AND OBJECT_ID('Regions') IS NOT NULL
BEGIN
    EXEC('CREATE TRIGGER trg_UserInquiry_LocationMap
    ON UserInquiry
    AFTER INSERT, UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;

        UPDATE ui
        SET
            district = d.district_name,
            region = r.region_name,
            allocated_lodge_id = COALESCE(ui.allocated_lodge_id,
                (
                    SELECT TOP 1 id
                    FROM Lodges
                    WHERE district_id = c.district_id
                    ORDER BY id
                )
            )
        FROM UserInquiry ui
        INNER JOIN inserted i ON ui.id = i.id
        LEFT JOIN county c ON c.county_name = COALESCE(NULLIF(i.lodge_county, ''''), i.county)
        LEFT JOIN Districts d ON d.id = c.district_id
        LEFT JOIN Regions r ON r.id = d.region_id;
    END;');
END;
