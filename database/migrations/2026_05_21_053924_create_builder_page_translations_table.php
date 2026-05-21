<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('builder_page_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('builder_page_id')->constrained('builder_pages')->cascadeOnDelete();
            $table->string('locale', 8)->index();
            $table->string('title');
            $table->longText('html')->nullable();
            $table->longText('css')->nullable();
            $table->json('components_json')->nullable();
            $table->json('styles_json')->nullable();
            $table->timestamps();
            $table->unique(['builder_page_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('builder_page_translations');
    }
};
