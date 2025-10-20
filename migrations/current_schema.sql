--
-- PostgreSQL database dump
--

\restrict 33DazQpyskvN6cOkNjTyL37tmwhqLohGeNHtMM1jfMiqv4KjNKop4811rhIRt3X

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_user_flags_modtime(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_flags_modtime() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.last_updated = now();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "expiresAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "accessTokenExpiresAt" timestamp without time zone,
    "refreshTokenExpiresAt" timestamp without time zone,
    scope text
);


--
-- Name: ai_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_analysis (
    analysis_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patent_id uuid,
    technology_summary text,
    key_innovation text,
    gaming_applications text[],
    technology_category character varying(300),
    gaming_segment character varying(300),
    innovation_score integer,
    commercial_potential_score integer,
    gaming_relevance_score integer,
    one_line_summary text,
    analysis_type character varying(20) DEFAULT 'basic'::character varying,
    analysis_status character varying(20) DEFAULT 'complete'::character varying,
    ai_model_used character varying(100),
    tokens_used integer,
    analysis_cost numeric(10,4),
    created_at timestamp without time zone DEFAULT now(),
    last_updated timestamp without time zone DEFAULT now(),
    one_line_pitch text,
    problem_solved text,
    disruptiveness_score integer,
    implementation_feasibility_score integer,
    potential_impact jsonb,
    strategic_importance jsonb,
    key_players jsonb,
    commercial_potential jsonb,
    implementation jsonb,
    competitive_analysis jsonb,
    risk_factors text[],
    research_recommendation jsonb,
    content_angles text[],
    CONSTRAINT ai_analysis_commercial_potential_score_check CHECK (((commercial_potential_score >= 0) AND (commercial_potential_score <= 100))),
    CONSTRAINT ai_analysis_disruptiveness_score_check CHECK (((disruptiveness_score >= 0) AND (disruptiveness_score <= 100))),
    CONSTRAINT ai_analysis_gaming_relevance_score_check CHECK (((gaming_relevance_score >= 0) AND (gaming_relevance_score <= 100))),
    CONSTRAINT ai_analysis_implementation_feasibility_score_check CHECK (((implementation_feasibility_score >= 0) AND (implementation_feasibility_score <= 100))),
    CONSTRAINT ai_analysis_innovation_score_check CHECK (((innovation_score >= 0) AND (innovation_score <= 100)))
);


--
-- Name: TABLE ai_analysis; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_analysis IS 'Stores comprehensive AI analysis from Claude Sonnet 4';


--
-- Name: COLUMN ai_analysis.potential_impact; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_analysis.potential_impact IS 'JSON: affected_companies, affected_game_types, market_opportunity';


--
-- Name: COLUMN ai_analysis.strategic_importance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_analysis.strategic_importance IS 'JSON: why_matters_now, industry_trends, disruption_level';


--
-- Name: COLUMN ai_analysis.key_players; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_analysis.key_players IS 'JSON: patent_holder, competitors_affected, potential_licensees';


--
-- Name: COLUMN ai_analysis.commercial_potential; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_analysis.commercial_potential IS 'JSON: revenue_opportunities, cost_savings, monetization_approach';


--
-- Name: COLUMN ai_analysis.implementation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_analysis.implementation IS 'JSON: complexity, timeline_to_market, adoption_barriers';


--
-- Name: COLUMN ai_analysis.competitive_analysis; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_analysis.competitive_analysis IS 'JSON: creates_moat, competitive_advantage, prior_art_comparison';


--
-- Name: COLUMN ai_analysis.research_recommendation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_analysis.research_recommendation IS 'JSON: depth_level, reasoning, priority';


--
-- Name: ai_analysis_deep; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_analysis_deep (
    deep_analysis_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patent_id uuid,
    executive_summary jsonb,
    technology_deep_dive jsonb,
    bottom_line jsonb,
    practical_applications jsonb,
    what_this_looks_like jsonb,
    scenarios jsonb,
    audience_takeaways jsonb,
    competitive_landscape jsonb,
    reality_check jsonb,
    implementation_analysis jsonb,
    market_context jsonb,
    risk_assessment jsonb,
    what_to_watch jsonb,
    content_hooks jsonb,
    final_take jsonb,
    scores jsonb,
    full_analysis jsonb,
    ai_model_used character varying(100) DEFAULT 'claude-sonnet-4-5-20250929'::character varying,
    tokens_used integer,
    analysis_cost numeric(10,4),
    created_at timestamp without time zone DEFAULT now(),
    competitive_impact jsonb,
    social_media_content jsonb
);


--
-- Name: assignees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignees (
    assignee_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    assignee_name character varying(255) NOT NULL,
    assignee_name_clean character varying(255) NOT NULL,
    assignee_type character varying(50),
    country character varying(2),
    is_tracked_company boolean DEFAULT false,
    company_category character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    last_updated timestamp without time zone DEFAULT now()
);


--
-- Name: claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.claims (
    claim_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patent_id uuid,
    claim_number integer NOT NULL,
    claim_type character varying(20),
    depends_on_claim integer,
    claim_text text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: content_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_queue (
    content_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patent_id uuid,
    content_type character varying(50),
    priority integer DEFAULT 5,
    headline text,
    summary_short text,
    summary_long text,
    key_takeaways text[],
    published boolean DEFAULT false,
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    full_analysis jsonb,
    CONSTRAINT content_queue_priority_check CHECK (((priority >= 1) AND (priority <= 5)))
);


--
-- Name: patent_assignees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patent_assignees (
    patent_id uuid NOT NULL,
    assignee_id uuid NOT NULL,
    sequence_order integer DEFAULT 0
);


--
-- Name: patents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patents (
    patent_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patent_number character varying(20) NOT NULL,
    application_number character varying(20),
    publication_number character varying(20),
    filing_date date,
    publication_date date,
    grant_date date,
    patent_status character varying(20) DEFAULT 'published'::character varying,
    patent_type character varying(20) DEFAULT 'utility'::character varying,
    title text NOT NULL,
    abstract text,
    claim_count integer DEFAULT 0,
    independent_claim_count integer DEFAULT 0,
    relevance_source character varying(50),
    matched_keywords text[],
    created_at timestamp without time zone DEFAULT now(),
    last_updated timestamp without time zone DEFAULT now(),
    description text,
    claims_text text,
    full_text text,
    figure_count integer DEFAULT 0,
    background text,
    summary text
);


--
-- Name: content_ready; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.content_ready AS
 SELECT c.content_id,
    c.priority,
    c.headline,
    c.summary_short,
    c.summary_long,
    c.key_takeaways,
    c.created_at,
    p.patent_number,
    p.title,
    a.assignee_name,
    ai.gaming_relevance_score
   FROM ((((public.content_queue c
     JOIN public.patents p ON ((c.patent_id = p.patent_id)))
     JOIN public.patent_assignees pa ON ((p.patent_id = pa.patent_id)))
     JOIN public.assignees a ON ((pa.assignee_id = a.assignee_id)))
     JOIN public.ai_analysis ai ON ((p.patent_id = ai.patent_id)))
  WHERE (c.published = false)
  ORDER BY c.priority, c.created_at DESC;


--
-- Name: high_value_patents; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.high_value_patents AS
 SELECT p.patent_id,
    p.patent_number,
    p.title,
    p.filing_date,
    p.grant_date,
    ai.gaming_relevance_score,
    ai.innovation_score,
    ai.commercial_potential_score,
    ai.disruptiveness_score,
    ai.one_line_pitch,
    ai.research_recommendation
   FROM (public.patents p
     JOIN public.ai_analysis ai ON ((p.patent_id = ai.patent_id)))
  WHERE (ai.gaming_relevance_score >= 70)
  ORDER BY ai.gaming_relevance_score DESC, ai.innovation_score DESC;


--
-- Name: inventors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventors (
    inventor_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    full_name character varying(255) NOT NULL,
    normalized_name character varying(255),
    country character varying(2),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: parsing_errors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parsing_errors (
    error_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patent_number character varying(20),
    error_type character varying(100),
    error_message text,
    raw_data_sample text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: patent_inventors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patent_inventors (
    patent_id uuid NOT NULL,
    inventor_id uuid NOT NULL,
    sequence_order integer DEFAULT 0,
    is_first_inventor boolean DEFAULT false
);


--
-- Name: patents_by_priority; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.patents_by_priority AS
 SELECT p.patent_id,
    p.patent_number,
    p.title,
    a.assignee_name,
    ai.one_line_pitch,
    ai.gaming_relevance_score,
    ai.innovation_score,
    ai.disruptiveness_score,
    (ai.research_recommendation ->> 'priority'::text) AS priority,
    (ai.research_recommendation ->> 'depth_level'::text) AS recommended_depth,
    (ai.research_recommendation ->> 'reasoning'::text) AS recommendation_reasoning,
    ai.technology_category,
    ai.gaming_segment,
    ai.created_at AS analyzed_at
   FROM (((public.patents p
     JOIN public.patent_assignees pa ON (((p.patent_id = pa.patent_id) AND (pa.sequence_order = 0))))
     JOIN public.assignees a ON ((pa.assignee_id = a.assignee_id)))
     JOIN public.ai_analysis ai ON ((p.patent_id = ai.patent_id)))
  ORDER BY
        CASE (ai.research_recommendation ->> 'priority'::text)
            WHEN 'critical'::text THEN 1
            WHEN 'high'::text THEN 2
            WHEN 'medium'::text THEN 3
            WHEN 'low'::text THEN 4
            ELSE 5
        END, ai.gaming_relevance_score DESC;


--
-- Name: patents_for_ai_analysis; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.patents_for_ai_analysis AS
 SELECT p.patent_id,
    p.patent_number,
    p.title,
    p.abstract,
    p.description,
    p.claims_text,
    p.full_text,
    p.claim_count,
    p.filing_date,
    p.grant_date,
    p.relevance_source,
    p.matched_keywords,
    a.assignee_name,
    a.assignee_type,
    a.country,
    a.is_tracked_company,
    a.company_category
   FROM (((public.patents p
     LEFT JOIN public.patent_assignees pa ON (((p.patent_id = pa.patent_id) AND (pa.sequence_order = 0))))
     LEFT JOIN public.assignees a ON ((pa.assignee_id = a.assignee_id)))
     LEFT JOIN public.ai_analysis ai ON ((p.patent_id = ai.patent_id)))
  WHERE (ai.analysis_id IS NULL)
  ORDER BY p.created_at DESC;


--
-- Name: patents_for_deep_dive; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.patents_for_deep_dive AS
 SELECT p.patent_id,
    p.patent_number,
    p.title,
    p.filing_date,
    p.grant_date,
    ai.gaming_relevance_score,
    ai.innovation_score,
    ai.commercial_potential_score,
    ai.disruptiveness_score,
    ai.implementation_feasibility_score,
    ai.one_line_pitch,
    (ai.research_recommendation ->> 'priority'::text) AS priority,
    (ai.research_recommendation ->> 'depth_level'::text) AS depth_level,
    (ai.research_recommendation ->> 'reasoning'::text) AS reasoning,
        CASE
            WHEN (ad.deep_analysis_id IS NOT NULL) THEN true
            ELSE false
        END AS has_deep_analysis
   FROM ((public.patents p
     JOIN public.ai_analysis ai ON ((p.patent_id = ai.patent_id)))
     LEFT JOIN public.ai_analysis_deep ad ON ((p.patent_id = ad.patent_id)))
  WHERE (((ai.research_recommendation ->> 'depth_level'::text) = 'deep_dive_recommended'::text) OR ((ai.research_recommendation ->> 'priority'::text) = ANY (ARRAY['critical'::text, 'high'::text])) OR (ai.gaming_relevance_score >= 85))
  ORDER BY
        CASE (ai.research_recommendation ->> 'priority'::text)
            WHEN 'critical'::text THEN 1
            WHEN 'high'::text THEN 2
            WHEN 'medium'::text THEN 3
            ELSE 4
        END, ai.gaming_relevance_score DESC;


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    id text NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    token text DEFAULT (gen_random_uuid())::text NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    name text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    image text
);


--
-- Name: user_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_flags (
    flag_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patent_id uuid NOT NULL,
    is_read boolean DEFAULT false,
    is_favourite boolean DEFAULT false,
    read_at timestamp without time zone,
    favourited_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    last_updated timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE user_flags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_flags IS 'Stores user flags (read, favourite) for patents';


--
-- Name: COLUMN user_flags.is_read; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_flags.is_read IS 'Whether the patent has been marked as read';


--
-- Name: COLUMN user_flags.is_favourite; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_flags.is_favourite IS 'Whether the patent has been marked as favourite';


--
-- Name: COLUMN user_flags.read_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_flags.read_at IS 'Timestamp when patent was marked as read';


--
-- Name: COLUMN user_flags.favourited_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_flags.favourited_at IS 'Timestamp when patent was marked as favourite';


--
-- Name: verification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: ai_analysis_deep ai_analysis_deep_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analysis_deep
    ADD CONSTRAINT ai_analysis_deep_pkey PRIMARY KEY (deep_analysis_id);


--
-- Name: ai_analysis ai_analysis_patent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analysis
    ADD CONSTRAINT ai_analysis_patent_id_key UNIQUE (patent_id);


--
-- Name: ai_analysis ai_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analysis
    ADD CONSTRAINT ai_analysis_pkey PRIMARY KEY (analysis_id);


--
-- Name: assignees assignees_assignee_name_clean_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignees
    ADD CONSTRAINT assignees_assignee_name_clean_key UNIQUE (assignee_name_clean);


--
-- Name: assignees assignees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignees
    ADD CONSTRAINT assignees_pkey PRIMARY KEY (assignee_id);


--
-- Name: claims claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_pkey PRIMARY KEY (claim_id);


--
-- Name: content_queue content_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_queue
    ADD CONSTRAINT content_queue_pkey PRIMARY KEY (content_id);


--
-- Name: inventors inventors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventors
    ADD CONSTRAINT inventors_pkey PRIMARY KEY (inventor_id);


--
-- Name: parsing_errors parsing_errors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parsing_errors
    ADD CONSTRAINT parsing_errors_pkey PRIMARY KEY (error_id);


--
-- Name: patent_assignees patent_assignees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patent_assignees
    ADD CONSTRAINT patent_assignees_pkey PRIMARY KEY (patent_id, assignee_id);


--
-- Name: patent_inventors patent_inventors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patent_inventors
    ADD CONSTRAINT patent_inventors_pkey PRIMARY KEY (patent_id, inventor_id);


--
-- Name: patents patents_patent_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patents
    ADD CONSTRAINT patents_patent_number_key UNIQUE (patent_number);


--
-- Name: patents patents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patents
    ADD CONSTRAINT patents_pkey PRIMARY KEY (patent_id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: ai_analysis_deep unique_patent_deep_analysis; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analysis_deep
    ADD CONSTRAINT unique_patent_deep_analysis UNIQUE (patent_id);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user_flags user_flags_patent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_flags
    ADD CONSTRAINT user_flags_patent_id_key UNIQUE (patent_id);


--
-- Name: user_flags user_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_flags
    ADD CONSTRAINT user_flags_pkey PRIMARY KEY (flag_id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: idx_account_userId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_account_userId" ON public.account USING btree ("userId");


--
-- Name: idx_ai_analysis_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_analysis_category ON public.ai_analysis USING btree (technology_category);


--
-- Name: idx_ai_analysis_depth_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_analysis_depth_level ON public.ai_analysis USING btree (((research_recommendation ->> 'depth_level'::text)));


--
-- Name: idx_ai_analysis_disruptiveness; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_analysis_disruptiveness ON public.ai_analysis USING btree (disruptiveness_score DESC);


--
-- Name: idx_ai_analysis_feasibility; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_analysis_feasibility ON public.ai_analysis USING btree (implementation_feasibility_score DESC);


--
-- Name: idx_ai_analysis_patent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_analysis_patent ON public.ai_analysis USING btree (patent_id);


--
-- Name: idx_ai_analysis_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_analysis_priority ON public.ai_analysis USING btree (((research_recommendation ->> 'priority'::text)));


--
-- Name: idx_ai_analysis_scores; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_analysis_scores ON public.ai_analysis USING btree (gaming_relevance_score DESC, innovation_score DESC);


--
-- Name: idx_ai_analysis_segment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_analysis_segment ON public.ai_analysis USING btree (gaming_segment);


--
-- Name: idx_ai_analysis_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_analysis_status ON public.ai_analysis USING btree (analysis_status);


--
-- Name: idx_assignees_tracked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignees_tracked ON public.assignees USING btree (is_tracked_company);


--
-- Name: idx_assignees_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignees_type ON public.assignees USING btree (assignee_type);


--
-- Name: idx_claims_patent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_claims_patent ON public.claims USING btree (patent_id, claim_number);


--
-- Name: idx_claims_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_claims_type ON public.claims USING btree (claim_type);


--
-- Name: idx_content_queue_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_queue_created ON public.content_queue USING btree (created_at DESC);


--
-- Name: idx_content_queue_patent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_queue_patent ON public.content_queue USING btree (patent_id);


--
-- Name: idx_content_queue_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_queue_priority ON public.content_queue USING btree (priority, created_at DESC);


--
-- Name: idx_content_queue_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_queue_published ON public.content_queue USING btree (published, priority);


--
-- Name: idx_content_queue_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_queue_type ON public.content_queue USING btree (content_type);


--
-- Name: idx_deep_analysis_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deep_analysis_created ON public.ai_analysis_deep USING btree (created_at DESC);


--
-- Name: idx_deep_analysis_patent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deep_analysis_patent ON public.ai_analysis_deep USING btree (patent_id);


--
-- Name: idx_inventors_normalized; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventors_normalized ON public.inventors USING btree (normalized_name);


--
-- Name: idx_parsing_errors_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_parsing_errors_created ON public.parsing_errors USING btree (created_at DESC);


--
-- Name: idx_parsing_errors_patent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_parsing_errors_patent ON public.parsing_errors USING btree (patent_number);


--
-- Name: idx_parsing_errors_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_parsing_errors_type ON public.parsing_errors USING btree (error_type);


--
-- Name: idx_patent_assignees_assignee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patent_assignees_assignee ON public.patent_assignees USING btree (assignee_id);


--
-- Name: idx_patent_assignees_patent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patent_assignees_patent ON public.patent_assignees USING btree (patent_id);


--
-- Name: idx_patent_inventors_inventor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patent_inventors_inventor ON public.patent_inventors USING btree (inventor_id);


--
-- Name: idx_patent_inventors_patent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patent_inventors_patent ON public.patent_inventors USING btree (patent_id);


--
-- Name: idx_patents_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patents_created ON public.patents USING btree (created_at DESC);


--
-- Name: idx_patents_description; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patents_description ON public.patents USING gin (to_tsvector('english'::regconfig, COALESCE(description, ''::text)));


--
-- Name: idx_patents_filing_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patents_filing_date ON public.patents USING btree (filing_date DESC);


--
-- Name: idx_patents_full_text_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patents_full_text_search ON public.patents USING gin (to_tsvector('english'::regconfig, COALESCE(full_text, ''::text)));


--
-- Name: idx_patents_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patents_number ON public.patents USING btree (patent_number);


--
-- Name: idx_patents_publication_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patents_publication_date ON public.patents USING btree (publication_date DESC);


--
-- Name: idx_patents_relevance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patents_relevance ON public.patents USING btree (relevance_source);


--
-- Name: idx_patents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patents_status ON public.patents USING btree (patent_status);


--
-- Name: idx_session_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_token ON public.session USING btree (token);


--
-- Name: idx_session_userId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_session_userId" ON public.session USING btree ("userId");


--
-- Name: idx_user_flags_favourite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_flags_favourite ON public.user_flags USING btree (is_favourite) WHERE (is_favourite = true);


--
-- Name: idx_user_flags_favourited_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_flags_favourited_at ON public.user_flags USING btree (favourited_at DESC);


--
-- Name: idx_user_flags_patent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_flags_patent ON public.user_flags USING btree (patent_id);


--
-- Name: idx_user_flags_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_flags_read ON public.user_flags USING btree (is_read) WHERE (is_read = true);


--
-- Name: idx_user_flags_read_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_flags_read_at ON public.user_flags USING btree (read_at DESC);


--
-- Name: idx_verification_identifier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_identifier ON public.verification USING btree (identifier);


--
-- Name: ai_analysis update_ai_analysis_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_analysis_modtime BEFORE UPDATE ON public.ai_analysis FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: assignees update_assignees_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assignees_modtime BEFORE UPDATE ON public.assignees FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: patents update_patents_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patents_modtime BEFORE UPDATE ON public.patents FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: user_flags update_user_flags_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_flags_modtime BEFORE UPDATE ON public.user_flags FOR EACH ROW EXECUTE FUNCTION public.update_user_flags_modtime();


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: ai_analysis_deep ai_analysis_deep_patent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analysis_deep
    ADD CONSTRAINT ai_analysis_deep_patent_id_fkey FOREIGN KEY (patent_id) REFERENCES public.patents(patent_id) ON DELETE CASCADE;


--
-- Name: ai_analysis ai_analysis_patent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analysis
    ADD CONSTRAINT ai_analysis_patent_id_fkey FOREIGN KEY (patent_id) REFERENCES public.patents(patent_id) ON DELETE CASCADE;


--
-- Name: claims claims_patent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_patent_id_fkey FOREIGN KEY (patent_id) REFERENCES public.patents(patent_id) ON DELETE CASCADE;


--
-- Name: content_queue content_queue_patent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_queue
    ADD CONSTRAINT content_queue_patent_id_fkey FOREIGN KEY (patent_id) REFERENCES public.patents(patent_id) ON DELETE CASCADE;


--
-- Name: patent_assignees patent_assignees_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patent_assignees
    ADD CONSTRAINT patent_assignees_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.assignees(assignee_id) ON DELETE CASCADE;


--
-- Name: patent_assignees patent_assignees_patent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patent_assignees
    ADD CONSTRAINT patent_assignees_patent_id_fkey FOREIGN KEY (patent_id) REFERENCES public.patents(patent_id) ON DELETE CASCADE;


--
-- Name: patent_inventors patent_inventors_inventor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patent_inventors
    ADD CONSTRAINT patent_inventors_inventor_id_fkey FOREIGN KEY (inventor_id) REFERENCES public.inventors(inventor_id) ON DELETE CASCADE;


--
-- Name: patent_inventors patent_inventors_patent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patent_inventors
    ADD CONSTRAINT patent_inventors_patent_id_fkey FOREIGN KEY (patent_id) REFERENCES public.patents(patent_id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user_flags user_flags_patent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_flags
    ADD CONSTRAINT user_flags_patent_id_fkey FOREIGN KEY (patent_id) REFERENCES public.patents(patent_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 33DazQpyskvN6cOkNjTyL37tmwhqLohGeNHtMM1jfMiqv4KjNKop4811rhIRt3X

