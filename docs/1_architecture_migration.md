# MMS & Visa Integration: Architecture Migration

This document outlines how to merge the standalone Visa Eligibility project into the MatchMySchool (MMS) consolidated system.

## 1. Database Consolidation

The goal is to use the MMS structure for the Visa test to avoid maintaining two separate database architectures.

### Mapping Local Models to MMS

| Visa Local Model   | MMS Collection         | Key Changes                                      |
| ------------------ | ---------------------- | ------------------------------------------------ |
| User               | users                  | Merge fields; add visaResults array if needed.   |
| Question           | eligibilitytests       | MMS stores questions _inside_ the test document. |
| EligibilityTest    | eligibilityassessments | This maps to the actual session/attempt.         |
| CountryRequirement | country_requirements   | Keep as is, used by the scraper.                 |

## 2. Shared Services

- **Auth**: Use the MMS Passport/JWT auth system.
- **Scraping**: The serveur scraper should be a shared microservice.
