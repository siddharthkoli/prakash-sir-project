DROP TABLE northstar.dbo.UserInquiry;

CREATE TABLE northstar.dbo.UserInquiry (
	id int IDENTITY(1,1) NOT NULL,
	firstName nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	lastName nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	email nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	phone nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	alternatePhone nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	bestTimeToContact nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	city nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	state nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	zip nvarchar(5) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	whereToMeet nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	comments nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	utmSource nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	createdAt datetime2 DEFAULT sysutcdatetime() NULL,
	CONSTRAINT PK__UserInqu__3213E83F0E4E9FA7 PRIMARY KEY (id)
);