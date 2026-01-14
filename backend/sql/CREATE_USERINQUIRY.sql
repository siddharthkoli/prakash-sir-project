-- Create UserInquiries table
CREATE TABLE UserInquiry (
    id INT IDENTITY(1,1) PRIMARY KEY,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    alternate_phone NVARCHAR(20),
    best_time_to_contact NVARCHAR(50) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    state NVARCHAR(100) NOT NULL,
    zip_code NVARCHAR(10) NOT NULL,
    where_to_meet NVARCHAR(MAX),
    comments NVARCHAR(MAX),
    utm_source NVARCHAR(100),
    status nvarchar(10) DEFAULT 'New',
    created_at DATETIME2 DEFAULT GETDATE()
);