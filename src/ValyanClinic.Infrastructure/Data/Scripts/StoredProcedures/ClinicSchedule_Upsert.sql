-- ============================================================
-- ClinicSchedule_Upsert — creare sau actualizare zi
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.ClinicSchedule_Upsert
    @ClinicId   UNIQUEIDENTIFIER,
    @DayOfWeek  TINYINT,
    @IsOpen     BIT,
    @OpenTime   VARCHAR(5),   -- "HH:mm" sau NULL
    @CloseTime  VARCHAR(5),   -- "HH:mm" sau NULL
    @UserId     UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @OpenTimeParsed  TIME(0) = TRY_CAST(@OpenTime  AS TIME(0))
    DECLARE @CloseTimeParsed TIME(0) = TRY_CAST(@CloseTime AS TIME(0))

    IF EXISTS (SELECT 1 FROM dbo.ClinicSchedule WHERE ClinicId = @ClinicId AND DayOfWeek = @DayOfWeek)
    BEGIN
        UPDATE dbo.ClinicSchedule
        SET
            IsOpen    = @IsOpen,
            OpenTime  = CASE WHEN @IsOpen = 1 THEN @OpenTimeParsed  ELSE NULL END,
            CloseTime = CASE WHEN @IsOpen = 1 THEN @CloseTimeParsed ELSE NULL END,
            UpdatedAt = GETDATE(),
            UpdatedBy = @UserId
        WHERE ClinicId = @ClinicId AND DayOfWeek = @DayOfWeek;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.ClinicSchedule (ClinicId, DayOfWeek, IsOpen, OpenTime, CloseTime, CreatedBy)
        VALUES (
            @ClinicId,
            @DayOfWeek,
            @IsOpen,
            CASE WHEN @IsOpen = 1 THEN @OpenTimeParsed  ELSE NULL END,
            CASE WHEN @IsOpen = 1 THEN @CloseTimeParsed ELSE NULL END,
            @UserId
        );
    END;
END;
GO
