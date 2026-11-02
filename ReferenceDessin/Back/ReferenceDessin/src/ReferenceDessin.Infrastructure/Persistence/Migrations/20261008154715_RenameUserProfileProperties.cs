using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReferenceDessin.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameUserProfileProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "NomAffiche",
                table: "AspNetUsers",
                newName: "DisplayName");

            migrationBuilder.RenameColumn(
                name: "CreeLeUtc",
                table: "AspNetUsers",
                newName: "CreatedAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DisplayName",
                table: "AspNetUsers",
                newName: "NomAffiche");

            migrationBuilder.RenameColumn(
                name: "CreatedAtUtc",
                table: "AspNetUsers",
                newName: "CreeLeUtc");
        }
    }
}
