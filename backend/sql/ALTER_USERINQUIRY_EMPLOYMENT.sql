-- Add employment type category and type columns to UserInquiry table
ALTER TABLE UserInquiry
ADD 
    employment_type_category NVARCHAR(100),
    employment_type NVARCHAR(100);

alter table UserInquiry
remove
    veteran,
    first_responder,
    law_enforcement;