"use client";

import { catchError } from "next/error";
import type { ReactNode } from "react";

/**
 * Shows `fallback` in place of header content that failed to render. The header
 * sits in the store layout, above every page's error boundary, so without this
 * one failed catalog read replaces the whole site with the global error page.
 */
export const HeaderBoundary = catchError((props: { fallback: ReactNode }) => props.fallback);
