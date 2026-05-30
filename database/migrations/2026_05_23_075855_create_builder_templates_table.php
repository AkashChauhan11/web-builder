<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('builder_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['section', 'page'])->default('section');
            $table->string('thumbnail_url')->nullable();
            $table->json('components_json');
            $table->longText('css')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_bundled')->default(false);
            $table->timestamps();

            $table->index(['type', 'is_bundled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('builder_templates');
    }
};
