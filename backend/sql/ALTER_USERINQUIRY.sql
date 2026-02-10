-- Add new columns to UserInquiry table for extended inquiry form

ALTER TABLE UserInquiry
ADD 
    county NVARCHAR(100),
    first_responder NVARCHAR(10),
    faith NVARCHAR(10),
    law_enforcement NVARCHAR(10),
    age NVARCHAR(10),
    veteran NVARCHAR(10),
    preferred_contact_method NVARCHAR(50),
    employment_status NVARCHAR(50),
    utm_medium NVARCHAR(100),
    utm_campaign NVARCHAR(100),
    utm_content NVARCHAR(100),
    utm_term NVARCHAR(100),
    gclid NVARCHAR(255),
    fbclid NVARCHAR(255),
    landing_page_url NVARCHAR(MAX),
    referrer_url NVARCHAR(MAX);
