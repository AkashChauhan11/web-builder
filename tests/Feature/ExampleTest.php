<?php

it('returns a successful response', function () {
    $response = $this->get('/admin/login');

    $response->assertStatus(200);
});
