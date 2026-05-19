package com.studytube.modules.user.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * Domain selection request — used during onboarding and domain updates.
 * At least 1, max 5 domains.
 */
@Data
public class UpdateDomainsRequest {

    @NotEmpty(message = "Select at least one domain")
    @Size(max = 5, message = "Maximum 5 domains allowed")
    private List<String> selectedDomains;
}
