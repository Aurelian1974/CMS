-- ============================================================
-- DoctorSchedule_Upsert — adaugă sau actualizează o zi de lucru
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.DoctorSchedule_Upsert
    @ClinicId   UNIQUEIDENTIFIER,
    @DoctorId   UNIQUEIDENTIFIER,
    @DayOfWeek  TINYINT,
    @StartTime  VARCHAR(5),   -- "HH:mm"
    @EndTime    VARCHAR(5),   -- "HH:mm"
    @UserId     UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @StartParsed TIME(0) = TRY_CAST(@StartTime AS TIME(0))
    DECLARE @EndParsed   TIME(0) = TRY_CAST(@EndTime   AS TIME(0))

    IF @StartParsed IS NULL OR @EndParsed IS NULL
    BEGIN
        RAISERROR('Format orar invalid. Utilizati HH:mm.', 16, 1);
        RETURN;
    END;

    IF @EndParsed <= @StartParsed
    BEGIN
        RAISERROR('Ora de sfarsit trebuie sa fie dupa ora de inceput.', 16, 1);
        RETURN;
    END;

    IF EXISTS (SELECT 1 FROM dbo.DoctorSchedule WHERE DoctorId = @DoctorId AND DayOfWeek = @DayOfWeek)
    BEGIN
        UPDATE dbo.DoctorSchedule
        SET
            StartTime = @StartParsed,
            EndTime   = @EndParsed,
            UpdatedAt = GETDATE(),
            UpdatedBy = @UserId
        WHERE DoctorId = @DoctorId AND DayOfWeek = @DayOfWeek;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.DoctorSchedule (ClinicId, DoctorId, DayOfWeek, StartTime, EndTime, CreatedBy)
        VALUES (@ClinicId, @DoctorId, @DayOfWeek, @StartParsed, @EndParsed, @UserId);
    END;
END;
GO
