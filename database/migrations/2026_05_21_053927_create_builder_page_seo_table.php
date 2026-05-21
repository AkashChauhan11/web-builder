<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('builder_page_seo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('builder_page_id')->constrained('builder_pages')->cascadeOnDelete();
            $table->string('locale', 8)->index();
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('meta_keywords')->nullable();
            $table->string('og_title')->nullable();
            $table->text('og_description')->nullable();
            $table->string('og_image')->nullable();
            $table->string('canonical_url')->nullable();
            $table->string('robots')->default('index,follow');
            $table->json('schema_json')->nullable();
            $table->timestamps();
            $table->unique(['builder_page_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('builder_page_seo');
    }
};
