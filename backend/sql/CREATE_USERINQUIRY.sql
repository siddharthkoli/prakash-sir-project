-- Create UserInquiries table
CREATE TABLE UserInquiry (
    id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
	first_name nvarchar(100) NOT NULL,
	last_name nvarchar(100) NOT NULL,
	email nvarchar(255) NOT NULL,
	phone nvarchar(20) NOT NULL,
	alternate_phone nvarchar(20) NULL,
	best_time_to_contact nvarchar(50) NOT NULL,
	city nvarchar(100) NOT NULL,
	state nvarchar(100) NOT NULL,
	zip_code nvarchar(10) NOT NULL,
	comments nvarchar(MAX) NULL,
	utm_source nvarchar(100) NULL,
	status nvarchar(10) DEFAULT 'New' NULL,
	created_at datetime2 DEFAULT getdate() NULL,
	county nvarchar(100) NULL,
	faith nvarchar(10) NULL,
	age nvarchar(10) NULL,
	preferred_contact_method nvarchar(50) NULL,
	employment_status nvarchar(50) NULL,
	utm_medium nvarchar(100) NULL,
	utm_campaign nvarchar(100) NULL,
	utm_content nvarchar(100) NULL,
	utm_term nvarchar(100) NULL,
	gclid nvarchar(255) NULL,
	fbclid nvarchar(255) NULL,
	landing_page_url nvarchar(MAX) NULL,
	referrer_url nvarchar(MAX) NULL,
	employment_type_category nvarchar(100) NULL,
	employment_type nvarchar(100) NULL,
    -- computed from county lookup (see trigger below)
    region nvarchar(100) NULL,
    district nvarchar(100) NULL,
    -- effective address fields (use lodge values when supplied)
    effective_city AS (CASE WHEN lodge_city IS NOT NULL AND lodge_city <> '' THEN lodge_city ELSE city END) PERSISTED,
    effective_state AS (CASE WHEN lodge_state IS NOT NULL AND lodge_state <> '' THEN lodge_state ELSE state END) PERSISTED,
    effective_county AS (CASE WHEN lodge_county IS NOT NULL AND lodge_county <> '' THEN lodge_county ELSE county END) PERSISTED,
	lodge_zip_code nvarchar(10) NULL,
	lodge_city nvarchar(30) NULL,
	lodge_state nvarchar(30) NULL,
	lodge_county nvarchar(30) NULL,
	lodge nvarchar(50) NULL,
	allocated_lodge_id int NULL,
	CONSTRAINT FK_UserInquiry_AllocatedLodge FOREIGN KEY (allocated_lodge_id) REFERENCES Lodges(id) ON DELETE SET NULL
);

-- automatically populate region/district (and optionally assign a lodge) based on whichever
-- county value is relevant (preferred lodge county overrides the main county).
-- the trigger is created only if the helper tables exist; the body uses left joins so it
-- will harmlessly leave the new columns NULL if the lookup fails.
IF OBJECT_ID('county') IS NOT NULL AND OBJECT_ID('Districts') IS NOT NULL AND OBJECT_ID('Regions') IS NOT NULL
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
