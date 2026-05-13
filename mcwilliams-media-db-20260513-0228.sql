--
-- PostgreSQL database dump
--

\restrict lPlQve6HG0T2aZWUEbcMLWDjlmEatHL2gqGu0bIpHSrgL6HB25TYYqelqUrqxTp

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agent_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_logs (
    id integer NOT NULL,
    uuid text NOT NULL,
    agent_name text NOT NULL,
    client_id integer,
    task_type text,
    input_summary text,
    output_summary text,
    status text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: agent_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_logs_id_seq OWNED BY public.agent_logs.id;


--
-- Name: audit_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_leads (
    id integer NOT NULL,
    uuid text NOT NULL,
    url text NOT NULL,
    city text NOT NULL,
    challenge text,
    email text,
    status text DEFAULT 'new'::text NOT NULL,
    scores jsonb,
    scan_data jsonb,
    business_type text,
    budget text,
    goal text,
    proposal_requested boolean DEFAULT false NOT NULL,
    proposal_requested_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    archived_at timestamp without time zone
);


--
-- Name: audit_leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_leads_id_seq OWNED BY public.audit_leads.id;


--
-- Name: cancellations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cancellations (
    id integer NOT NULL,
    uuid text NOT NULL,
    client_name text NOT NULL,
    business_name text,
    client_email text,
    client_strategist text,
    reason text,
    notes text,
    cancelled_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: cancellations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cancellations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cancellations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cancellations_id_seq OWNED BY public.cancellations.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    uuid text NOT NULL,
    onboarding_client_uuid text,
    contract_uuid text,
    business_name text NOT NULL,
    plan_tier text NOT NULL,
    services text DEFAULT '[]'::text NOT NULL,
    monthly_value numeric(10,2),
    seo_amount numeric(10,2),
    google_ads_amount numeric(10,2),
    meta_ads_amount numeric(10,2),
    social_media_amount numeric(10,2),
    email_amount numeric(10,2),
    blog_amount numeric(10,2),
    hosting_amount numeric(10,2),
    lsa_amount numeric(10,2),
    hosting_package text,
    start_date timestamp without time zone,
    renewal_date timestamp without time zone,
    health_score integer,
    client_strategist text,
    assigned_team_member text,
    brand_voice_profile jsonb,
    knowledge_base_notes text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id integer NOT NULL,
    uuid text NOT NULL,
    proposal_id text,
    client_name text NOT NULL,
    business_name text NOT NULL,
    client_email text NOT NULL,
    contract_type text DEFAULT 'website'::text NOT NULL,
    total_cost numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    deposit_amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    remaining_balance numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    hosting_option text DEFAULT 'none'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    signature_data text,
    signed_at timestamp without time zone,
    referral_source text,
    team_member text,
    company_address text,
    company_address_line2 text,
    company_city text,
    company_state text,
    company_zip text,
    schedule_a text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contracts_id_seq OWNED BY public.contracts.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    title text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: knowledge_base; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_base (
    id integer NOT NULL,
    uuid text NOT NULL,
    client_id integer NOT NULL,
    entry_type text NOT NULL,
    content text NOT NULL,
    created_by text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: knowledge_base_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.knowledge_base_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: knowledge_base_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knowledge_base_id_seq OWNED BY public.knowledge_base.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    uuid text NOT NULL,
    business_name text NOT NULL,
    contact_name text,
    email text,
    phone text,
    website text,
    city text,
    audit_score jsonb,
    goal text,
    budget_range text,
    status text DEFAULT 'new'::text NOT NULL,
    source text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: master_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.master_clients (
    id integer NOT NULL,
    uuid text NOT NULL,
    flag text DEFAULT ''::text NOT NULL,
    client_name text NOT NULL,
    strategist text DEFAULT ''::text NOT NULL,
    website boolean DEFAULT false NOT NULL,
    hosting boolean DEFAULT false NOT NULL,
    seo boolean DEFAULT false NOT NULL,
    adwords boolean DEFAULT false NOT NULL,
    fbads boolean DEFAULT false NOT NULL,
    lsa boolean DEFAULT false NOT NULL,
    email boolean DEFAULT false NOT NULL,
    social boolean DEFAULT false NOT NULL,
    blog boolean DEFAULT false NOT NULL,
    mailbox boolean DEFAULT false NOT NULL,
    photo boolean DEFAULT false NOT NULL,
    tier text DEFAULT ''::text NOT NULL,
    touchpoint text DEFAULT ''::text NOT NULL,
    upsell text DEFAULT ''::text NOT NULL,
    next_target text DEFAULT ''::text NOT NULL,
    other text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: master_clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.master_clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: master_clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.master_clients_id_seq OWNED BY public.master_clients.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: monthly_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_tasks (
    id integer NOT NULL,
    uuid text NOT NULL,
    client_id integer NOT NULL,
    project_id integer,
    task_type text NOT NULL,
    assigned_to text,
    due_date timestamp without time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    output_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: monthly_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.monthly_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: monthly_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.monthly_tasks_id_seq OWNED BY public.monthly_tasks.id;


--
-- Name: onboarding_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_clients (
    id integer NOT NULL,
    uuid text NOT NULL,
    client_name text NOT NULL,
    business_name text NOT NULL,
    client_email text,
    client_strategist text,
    services text DEFAULT '[]'::text NOT NULL,
    proposal_id text,
    contract_id text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: onboarding_clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.onboarding_clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: onboarding_clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.onboarding_clients_id_seq OWNED BY public.onboarding_clients.id;


--
-- Name: onboarding_form_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_form_responses (
    id integer NOT NULL,
    uuid text NOT NULL,
    onboarding_client_id text NOT NULL,
    responses text DEFAULT '{}'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    submitted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: onboarding_form_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.onboarding_form_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: onboarding_form_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.onboarding_form_responses_id_seq OWNED BY public.onboarding_form_responses.id;


--
-- Name: onboarding_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_tasks (
    id integer NOT NULL,
    proposal_uuid text NOT NULL,
    label text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: onboarding_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.onboarding_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: onboarding_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.onboarding_tasks_id_seq OWNED BY public.onboarding_tasks.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    uuid text NOT NULL,
    client_id integer NOT NULL,
    type text NOT NULL,
    phase text,
    status text DEFAULT 'planning'::text NOT NULL,
    deadline timestamp without time zone,
    deliverables jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposals (
    id integer NOT NULL,
    uuid text NOT NULL,
    client_name text NOT NULL,
    business_name text NOT NULL,
    client_email text NOT NULL,
    project_type text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    content text,
    special_context text,
    loom_video_url text,
    calendly_url text,
    signature_data text,
    signed_at timestamp without time zone,
    view_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    number_of_pages integer,
    page_names text,
    client_strategist text,
    notes text,
    last_viewed_at timestamp without time zone,
    selected_tier text,
    pricing_items text,
    brand_shoot_enabled boolean DEFAULT true NOT NULL,
    brand_shoot_text text,
    discount_type text,
    discount_value numeric(10,2),
    discount_label text
);


--
-- Name: proposals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proposals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proposals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proposals_id_seq OWNED BY public.proposals.id;


--
-- Name: agent_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_logs ALTER COLUMN id SET DEFAULT nextval('public.agent_logs_id_seq'::regclass);


--
-- Name: audit_leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_leads ALTER COLUMN id SET DEFAULT nextval('public.audit_leads_id_seq'::regclass);


--
-- Name: cancellations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellations ALTER COLUMN id SET DEFAULT nextval('public.cancellations_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: contracts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts ALTER COLUMN id SET DEFAULT nextval('public.contracts_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: knowledge_base id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_base ALTER COLUMN id SET DEFAULT nextval('public.knowledge_base_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: master_clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_clients ALTER COLUMN id SET DEFAULT nextval('public.master_clients_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: monthly_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_tasks ALTER COLUMN id SET DEFAULT nextval('public.monthly_tasks_id_seq'::regclass);


--
-- Name: onboarding_clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_clients ALTER COLUMN id SET DEFAULT nextval('public.onboarding_clients_id_seq'::regclass);


--
-- Name: onboarding_form_responses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_form_responses ALTER COLUMN id SET DEFAULT nextval('public.onboarding_form_responses_id_seq'::regclass);


--
-- Name: onboarding_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_tasks ALTER COLUMN id SET DEFAULT nextval('public.onboarding_tasks_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: proposals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals ALTER COLUMN id SET DEFAULT nextval('public.proposals_id_seq'::regclass);


--
-- Data for Name: agent_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agent_logs (id, uuid, agent_name, client_id, task_type, input_summary, output_summary, status, created_at) FROM stdin;
\.


--
-- Data for Name: audit_leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_leads (id, uuid, url, city, challenge, email, status, scores, scan_data, business_type, budget, goal, proposal_requested, proposal_requested_at, created_at, updated_at, archived_at) FROM stdin;
1	94bd0166-9a4a-40f0-bc2b-790774d23ba8	https://example.com	Tulsa, OK	Not enough leads	\N	new	\N	\N	\N	\N	\N	f	\N	2026-05-07 20:33:38.790911	2026-05-07 20:33:38.790911	\N
2	430d9978-3ab9-482a-9906-f73eaa1f1e1b	https://mcwilliamsmedia.com	Broken Arrow, OK	Growing digital presence	\N	new	\N	\N	\N	\N	\N	f	\N	2026-05-07 20:38:54.347761	2026-05-07 20:38:54.347761	\N
3	c4988f60-fabe-478d-8684-73ce4d17bcd8	https://google.com	Tulsa, OK	\N	\N	new	\N	\N	\N	\N	\N	f	\N	2026-05-07 20:41:06.238093	2026-05-07 20:41:06.238093	\N
4	3ec3625e-319b-4bb6-bab0-ec16e481fa56	http://localhost/internal	Tulsa, OK	\N	\N	new	\N	\N	\N	\N	\N	f	\N	2026-05-07 20:41:06.324036	2026-05-07 20:41:06.324036	\N
5	d43e127c-923e-409d-92af-40a5744e4176	https://tulsakwikdry.com	Tulsa, OK	Need more internet leads.	\N	new	\N	\N	\N	\N	\N	f	\N	2026-05-07 21:02:42.977593	2026-05-07 21:02:42.977593	\N
6	31f56417-bd00-4ce2-af64-e2e2ed0fdd3c	https://tulsakwikdry.com	Tulsa, OK	Need more internet leads.	\N	new	\N	\N	\N	\N	\N	f	\N	2026-05-07 21:03:08.668223	2026-05-07 21:03:08.668223	\N
7	793b0753-a2db-415b-942c-a0fbe3f6ee91	https://mcwilliamsmedia.com	Broken Arrow, OK	Need more local dental clients.	\N	new	\N	\N	\N	\N	\N	f	\N	2026-05-07 21:14:09.775019	2026-05-07 21:14:09.775019	\N
8	cbf4fc96-ff28-4a05-8b6c-f0ae6aa0a7fb	https://example.com	Tulsa, OK	leads	\N	new	\N	\N	\N	\N	\N	f	\N	2026-05-08 17:31:38.056543	2026-05-08 17:31:38.056543	\N
\.


--
-- Data for Name: cancellations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cancellations (id, uuid, client_name, business_name, client_email, client_strategist, reason, notes, cancelled_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, uuid, onboarding_client_uuid, contract_uuid, business_name, plan_tier, services, monthly_value, seo_amount, google_ads_amount, meta_ads_amount, social_media_amount, email_amount, blog_amount, hosting_amount, lsa_amount, hosting_package, start_date, renewal_date, health_score, client_strategist, assigned_team_member, brand_voice_profile, knowledge_base_notes, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contracts (id, uuid, proposal_id, client_name, business_name, client_email, contract_type, total_cost, deposit_amount, remaining_balance, hosting_option, status, signature_data, signed_at, referral_source, team_member, company_address, company_address_line2, company_city, company_state, company_zip, schedule_a, created_at, updated_at) FROM stdin;
3	9dbc72f0-f5fd-49b5-96d3-e41da5ebde17	a4e3e9a4-b669-4f0e-b3b6-c2872732d4bc	Lindsay McWilliams	Finding Easy	lindsaymcwilliams@gmail.com	website	3000.00	1000.00	2000.00	basic	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N		2026-05-05 23:15:52.218205	2026-05-05 23:15:52.218205
6	079663b9-ee9f-4b4a-966a-9832b6640efc	76855ab6-0daa-4165-b6ac-c259b27eec0b	Mike Johnson	Johnson Boats	matt32mc@gmail.com	website	0.00	0.00	0.00	none	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	Website Design & Development — 1-Page WordPress Website\n\nPages: US\n\nDeliverables:\n• Mobile-responsive design built on WordPress\n• Content integration and proofing\n• Google Analytics & Search Console setup\n• Social media links and contact form integration\n• Screen-recorded backend training session\n• Privacy Policy, Terms & Conditions, and Site Map pages\n\nTotal Investment: $0	2026-05-07 03:53:03.7304	2026-05-07 12:09:09.391
7	436dd3a7-8b15-4ed2-9452-aac4d4e1cb0e	2affdd1c-99f8-4640-ac02-cd461bf862be	John Johnson	Johnson Boats	matt32mc@gmail.com	website	0.00	0.00	0.00	none	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	Website Design & Development — 4-Page WordPress Website\n\nPages: Home, About, Services, Contact\n\nDeliverables:\n• Mobile-responsive design built on WordPress\n• Content integration and proofing\n• Google Analytics & Search Console setup\n• Social media links and contact form integration\n• Screen-recorded backend training session\n• Privacy Policy, Terms & Conditions, and Site Map pages\n\nTotal Investment: $0	2026-05-07 12:20:16.341957	2026-05-07 12:20:16.341957
4	7dd8d4fa-3d7f-4e3a-a566-948673106d72	132d6126-b782-470c-81e8-a59afd8820d7	Matthew McWilliams	Acme	matt32mc@gmail.com	website	3000.00	1500.00	1500.00	basic	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	Website Design & Development — 1-Page WordPress Website\n\nPages: Home\n\nDeliverables:\n• Mobile-responsive design built on WordPress\n• Content integration and proofing\n• Google Analytics & Search Console setup\n• Social media links and contact form integration\n• Screen-recorded backend training session\n• Privacy Policy, Terms & Conditions, and Site Map pages\n\nTotal Investment: $3000	2026-05-07 03:27:07.812538	2026-05-07 03:32:07.118
5	f2d4abfb-a7a6-4a1c-aab4-7c72d17637ae	897f94b5-1987-4ffe-acbd-99e2394b4d59	Mike	Smith	matt32mc@gmail.com	website	3000.00	1500.00	1500.00	basic	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	Website Design & Development — 2-Page WordPress Website\n\nPages: About, Contact\n\nDeliverables:\n• Mobile-responsive design built on WordPress\n• Content integration and proofing\n• Google Analytics & Search Console setup\n• Social media links and contact form integration\n• Screen-recorded backend training session\n• Privacy Policy, Terms & Conditions, and Site Map pages\n\nTotal Investment: $3000	2026-05-07 03:47:19.378365	2026-05-07 03:49:07.525
8	f59eab48-8569-4f2e-a2a8-4c0ef3c3cb24	b73d358e-db62-4037-8ad9-98bb2bf0b967	Matt McW	MCW Inc	matt32mc@gmail.com	marketing	0.00	0.00	0.00	none	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-07 13:54:22.007759	2026-05-07 14:58:23.488
9	cc53ad7c-a8ef-4c5e-886e-4bc8c1c88340	7f4c45ed-6c4c-418b-ba5d-5308bb855b70	Matt Mcw	MCW Inc.	matt32mc@gmail.com	website	0.00	0.00	0.00	none	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	Website Design & Development — 5-Page WordPress Website\n\nPages: Home, About, Services, Contact\n\nDeliverables:\n• Mobile-responsive design built on WordPress\n• Content integration and proofing\n• Google Analytics & Search Console setup\n• Social media links and contact form integration\n• Screen-recorded backend training session\n• Privacy Policy, Terms & Conditions, and Site Map pages	2026-05-07 16:26:48.716782	2026-05-07 16:26:48.716782
10	723ed467-047d-496b-b924-f7e3549a9adb	7af22436-5bf4-4da7-9c20-10a22e6fc836	John	ace	matt32mc@gmail.com	website	4365.00	2183.00	2182.00	none	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	Website Design & Development — 5-Page WordPress Website\n\nPages: Home, About, Services, Contact\n\nDeliverables:\n• Mobile-responsive design built on WordPress\n• Content integration and proofing\n• Google Analytics & Search Console setup\n• Social media links and contact form integration\n• Screen-recorded backend training session\n• Privacy Policy, Terms & Conditions, and Site Map pages	2026-05-07 16:27:34.498577	2026-05-07 17:14:06.486
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversations (id, title, created_at) FROM stdin;
\.


--
-- Data for Name: knowledge_base; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.knowledge_base (id, uuid, client_id, entry_type, content, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leads (id, uuid, business_name, contact_name, email, phone, website, city, audit_score, goal, budget_range, status, source, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: master_clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.master_clients (id, uuid, flag, client_name, strategist, website, hosting, seo, adwords, fbads, lsa, email, social, blog, mailbox, photo, tier, touchpoint, upsell, next_target, other, sort_order, created_at, updated_at) FROM stdin;
2	b5bcfb63-204c-4c59-bf76-96568df96822		3 Delta Window Films	Rachelle	t	t	f	f	f	f	f	f	f	f	f	Tier 1					2	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
3	1a1cf898-b802-4b8e-8e4d-48da43914b44		360+ Construction	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					3	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
4	e25d0abc-c371-43bc-a81d-26240e34e03b		5th Quarter Officiating	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1					4	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
5	379d4578-9a5a-40ed-80a3-b5bbc5b4ee4b		Accounting Outsourcing Solutions	Tiffany	f	t	f	f	f	f	f	f	f	f	f	Tier 1	Week of 7/7		July 2026		5	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
6	17285749-e883-424c-889c-a1deb6d5c93c		Action COACH Tulsa	Tiffany	t	f	t	f	f	f	f	f	f	f	f	Tier 1					6	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
7	f332d30a-7829-4f5e-81d8-1178a0bd82fe		Action Pest Management	Tiffany	t	t	t	f	f	f	f	f	f	f	f	Tier 2	Week of 7/7	Blog Add-On + Google LSA	July 2026	TK Sent proposal on 7/18 with follow-up call scheduled for 7/21	7	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
8	bd1fe13c-73c3-4e6c-b402-685ab25fff57		Acura Neon	Tiffany	t	t	t	f	f	f	f	f	t	f	f	Tier 1	Week of 7/7	SEO + Blog	July 2026	TK sent proposal on 7/18	8	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
9	dfd7adfd-9b04-45ab-9afe-1266474f8a40		Adept Patriot Services	Rachelle	f	f	t	f	f	f	f	f	f	f	f	Tier 1					9	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
10	4b6b1de2-3810-4ec1-b3cb-5b7d411169b4		Align Sport & Spine	Elise	t	t	f	f	f	f	f	f	f	f	f	Tier 1	Week of 7/7		July 2026		10	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
11	522e1867-e7b1-4649-8804-b7a8b1df8f83		All Dry Services, LLC	Tiffany	f	f	f	f	f	f	f	t	f	f	f						11	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
12	69ca4b7b-57f0-4f91-a7da-106a8859540b		All Dry of OKC	Tiffany	f	f	f	f	f	f	f	t	f	f	f	Tier 1					12	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
13	f12ba5d0-a34a-48f8-8a3f-58d5cb72f002		All Dry of Tulsa	Tiffany	f	f	f	f	f	f	f	t	f	f	f	Tier 1					13	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
14	d6bddf06-983b-45ad-b62d-db4886148a6b		All India Sourcing Group	Tiffany	f	t	t	f	f	f	f	f	f	f	f	Tier 2					14	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
15	4938847c-ab59-44fc-9564-9e2d734faff6		Alli Hayes Real Estate Group	Tiffany	f	f	f	f	f	f	f	t	f	f	f	Tier 1	Week of 7/7		July 2026		15	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
16	1fdc57af-9168-444b-a57a-3e47f4245209		Allied Broadcasting	Tiffany	f	f	f	f	f	f	t	t	f	f	f	Tier 2					16	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
17	6ea5f514-8246-4ef0-96e9-c020f0175ce1		American Pipe Bending	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1	Week of 7/7		July 2026		17	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
18	06d6f350-8bc9-46fa-b48b-334e32d378d9		AMV Exterior Contracting	Rachelle	f	t	f	f	f	f	f	f	f	f	f	Tier 2					18	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
19	61179c9d-5d5c-4d36-a2bf-dc44d65c72b2		Antiquities (Mike Withers)	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1	Week of 7/7		July 2026		19	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
20	74afdfb9-6e54-4f7b-a46e-e9122cc9f1b7		Archer HR Consulting	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1	Week of 8/19				20	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
21	7a8ec899-c5e5-4b53-b8dc-1575de2a5dae		Archer Insurance	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1	Week of 7/7		July 2026		21	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
22	d0f75bab-4d72-4075-9db6-3aac379db1d2		Ark Roofing	Rachelle	t	t	t	f	f	f	f	f	f	f	f	Tier 2					22	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
23	be04fd00-3448-4e57-b53b-5fc5bfa98273		ArtsOK	Elise	t	t	f	f	f	f	f	f	f	f	f	Tier 1					23	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
24	3ecb2bc3-93f4-43aa-9b33-cf41583fcac0		Ashes Away Chimney Sweep	Matt	f	t	f	t	f	f	f	f	f	f	f	Tier 1					24	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
25	fa0c73bd-94d9-4d55-b29c-a05c656ca879		Atlas Lounge/SJS Hospitality	Tiffany	t	t	f	f	f	f	f	t	f	f	f	Tier 1	Week of 7/21	New Website!		Doing a one time Newsletter, won't be a monthly plan	25	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
26	6d3b2875-8f37-412f-ab98-9f718054ac84		Atmos Design Build	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1	Week of 8/19				26	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
27	7a122f57-f89d-4c47-9704-24152d1f1007		BA Buzz	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1	Week of 7/7				27	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
28	dcb56a66-05cd-4454-823c-51bb2e747c45		BAPS Foundation	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1	Week of 8/19	What's your goals?			28	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
29	f1c2308a-b05e-4ee2-bdb5-58926964ac75		BCB Energy Solutions	Rachelle	t	t	f	f	f	f	f	f	f	f	f	Tier 2	Week 7/7	Signed contract for SEO services with GMB	July 2026		29	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
30	c5eb6b82-c1d8-4d24-b06e-74c16aafffdd		Bella Vita Spa and Salon	Rachelle	f	t	f	f	f	f	f	f	f	f	f	Tier 1					30	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
31	0c9a2d7d-77ec-482d-bf92-41abcb09ed45		Blackwood Real Estate	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1					31	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
32	e7da19bd-e570-4a46-84f3-81bf28fdbd7f		Bledsoe, Hewitt, & Gullekson	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1	Week of 8/19				32	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
33	c195d231-8552-461d-973d-e0b94538d204		Blessings International	Rachelle	f	t	t	t	f	f	f	f	f	f	f	Tier 3	Week of 8/19	Meeting set for 8/20	November 2025		33	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
34	238a5676-1ae7-40f4-b4c1-a7f665cfc3b5		Blue Dome Dining	Tiffany	t	t	f	f	f	f	f	f	f	f	f						34	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
35	95720e21-1064-4c7a-b7b2-629237bc8b06		Box Construction	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					35	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
36	65d5eec0-2282-405e-a85e-c64099d21aff		Bright Home Health	Tiffany	f	f	t	f	f	f	f	f	f	f	f	Tier 1					36	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
37	fb776f8b-c08a-467f-bd3c-cd14ee54c365		Broken Arrow Family Dentistry	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1					37	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
38	08c0503c-543e-45ec-bc1b-bc3b72fcf1db		Broken Arrow Varsity Football Booster Club	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					38	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
39	32ac74de-654e-4910-a3d8-a54a0476d8d4		Bruner Law Firm	Tiffany	f	t	t	f	f	f	f	f	f	f	f	Tier 2					39	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
40	30b3ecd9-1e7c-489a-b9c8-ba319386daf9		Buccal Up - Denistry for You OKC	Matt	t	t	t	f	f	f	f	t	f	f	f	Tier 3					40	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
41	46ea2c80-ad71-4501-8d07-ae8f0c0ad720		Buccal Up Dental - Your Olathe Dentist	Matt	t	t	t	f	f	f	f	t	f	t	f	Tier 3					41	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
42	e6287fff-5b77-4fea-a42a-2f86382a61ec		Buccal Up Dental- Corp	Matt	t	t	t	f	f	f	f	t	f	f	f	Tier 3				CA facebook pg checks	42	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
43	3b7e5d20-0668-48e8-a796-84704756d35f		Buccal Up Dentistry for you Broken Arrow	Matt	f	t	t	t	f	f	f	f	t	f	f	Tier 3					43	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
44	74f219c3-7bf0-40c4-8a77-4183e0357575	-	Buccal Up McDougall	Matt	t	t	t	f	f	f	f	f	f	f	f	Tier 3					44	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
45	24262391-087a-4c4b-8719-ee8e498df6a7	-	Buccal Up- Denistry for You SS	Matt	f	t	t	t	f	f	f	f	t	f	f	Tier 3					45	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
46	d7a68cb7-a3ed-418b-9388-7884e88944b4		CamTech	Matt	t	f	t	f	f	f	f	f	f	f	f	Tier 1					46	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
47	09bb009f-5145-48d0-afd7-bea71b4b7266		Care Family Medical & Chiropractic	Matt	f	f	t	t	t	f	t	f	f	f	f	Tier 3					47	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
48	ee679a34-f45b-4b92-8ea3-faf97140855b		CFC Law	Tiffany	t	f	f	f	f	t	f	f	f	f	f						48	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
49	7c2f81ea-2e62-4841-b314-e9de32f83b55		Chapman Edge & Engine	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					49	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
50	6c6d96ad-8e44-4dff-a0e1-0d49e9065f53		Child Advocacy Network	Matt	f	t	f	f	f	f	f	f	f	f	f						50	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
51	d30b4884-3c6e-4d92-9e14-3c06dff34b53		Chiropractic Association	Rachelle	t	t	f	f	f	f	f	f	f	f	f	Tier 1					51	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
52	577d7dcb-bca2-4544-9423-1bae1969e410		Christian Family Institute	Rachelle	t	t	f	f	f	f	f	f	f	f	f	Tier 1					52	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
53	46340678-e9b0-43b2-a508-ab739f048188		Coffman & Seidenberger, PLLC	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1	Week of 7/28		July 2026		53	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
54	15c50d42-8a64-4079-8465-f697bb5aec92		Cole Tech	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					54	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
55	5ff8cdaf-bd2c-4b2a-aa6f-020936b6420d		Colton's Support (DND)	Support	t	t	f	f	f	f	f	t	f	f	f	Tier 2					55	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
56	3c2c7eaa-020b-4c4e-81fa-79b52b187e04		Conklin, Gilpin, Wertz	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1	Week of 7/28				56	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
57	b4d718b2-0963-400f-88fb-0f0ccbd79747		Core Rehab	Tiffany	f	t	f	f	f	f	f	f	f	f	f	Tier 1	Week of 7/14		July 2026		57	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
58	bf254918-07e0-45ed-85fb-d97ce6c428e0		Cornerstone FSOK	Elise	t	t	f	f	f	f	f	f	f	f	f						58	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
59	f301330d-61d6-48d4-ad64-c70e55688a89	?	Crown Office Furnishings	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					59	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
60	5669b59c-574f-489d-b6ae-f61805ce5845		Cultivate Primary Care	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					60	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
61	176f646d-d9d1-4895-9cae-1f4eeac466f6	?	CWC Interiors	Tiffany	t	f	f	f	f	f	f	f	f	f	f						61	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
62	ddbceaad-9638-48e9-b55e-c74465b0f7f2		DMD Alarm Pro	Tiffany	t	t	t	t	f	f	t	t	f	f	f						62	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
63	5fe7488d-f2de-4606-a447-749bdf6dd5c3		DomesticAide	Rachelle	t	f	t	t	f	f	f	f	f	f	f	Tier 2					63	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
64	7e75976f-8d15-4059-ba13-7d49dfa04dfe		Dr. Chadwick Webster DDS	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1					64	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
65	cc8dd297-61c5-41c4-9331-831731e6a573		Dragonfly Enterprises (DND)	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1					65	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
66	c0c774ad-bb37-4576-adbc-bc28c8ffd49d		Eagle Rock Realty & Property Management	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					66	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
67	95f83e6f-830b-45e5-b1a6-30c445b76282		Eastern Oklahoma Chiropractic-Travis Ring	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					67	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
68	7694c0d5-2ac7-4baf-9eb3-c8725934c73f		Eastern Oklahoma Wellness & Chiropractic	Rachelle	t	t	t	t	f	f	f	t	f	f	f	Tier 3					68	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
69	d1b2c226-1683-4177-85d5-381953d3f07e		Elite Home Pest Service (DND)	Rachelle	f	t	f	f	f	f	f	f	f	f	f	Tier 1					69	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
70	60999700-37ef-4c09-af7c-9388e6217af5		Elite Outdoor Services LLC	Rachelle	t	t	t	t	f	f	f	f	f	t	f	Tier 3					70	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
71	0f5d9176-ca75-451e-9d92-36c976d8a42b		Emerald House Design Co	Rachelle	t	t	t	f	f	f	f	f	f	f	f	Tier 2					71	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
72	10986fe6-908a-4c2d-95ef-334a69be37ac		Emerald Quest	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1					72	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
73	0828f4b4-0950-4cf9-ac37-c7c7456e77dd		Empowered Life Counseling (DND)	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1					73	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
74	57d001c1-e2f7-401d-8ba8-ee0ffc65fa4f		Encore Coummincations	Tiffany	t	f	t	t	f	f	t	t	f	f	f	Tier 3					74	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
75	f3691515-50d7-4541-92b5-281f0bda236b		Envirovalve	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1					75	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
76	774898df-1e22-4f6f-b05a-b2923be18973		EOWC Medical-Rick Barnes	Rachelle	t	t	t	f	f	f	f	f	f	f	f	Tier 2					76	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
77	ffd76f84-27a3-45f6-9ee6-b02fda9a2331		Events By Lisa	Matt	t	f	f	f	f	f	f	f	f	f	f						77	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
78	077986ba-5e85-4336-b164-f7a542ad1c23		Evolution Mental Health	Rachelle	t	f	t	f	f	f	f	f	f	f	f	Tier 1					78	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
79	8a0e3180-e846-4c0a-87da-119d123fe9b2		Expanded Solutions	Tiffany	t	f	f	f	f	f	f	f	f	f	f	Tier 1					79	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
80	37c3ed59-39e7-4da9-a5eb-b59bd5948c26		Faith Tabernacle	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1					80	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
81	19c42d7e-17f3-441c-9518-43ea20575878		Floor and Restore by George	Matt	t	t	f	f	f	f	f	f	f	f	f						81	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
82	782b27eb-56a1-4266-9ddf-c772bf84749b		Foundation Law Wesley Cherry	Matt	t	t	t	t	t	f	f	f	f	f	f	Tier 3					82	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
83	43fb2325-c329-4302-a6e0-d819b25d70dd		Frasier Law	Tiffany	t	t	t	t	f	t	f	f	t	f	f						83	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
84	c0c4bd99-3d39-415a-a7b3-4f74ab118f5b		Fusion Enterprises LLC	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1					84	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
85	ff1b5dec-d8b2-49c2-a4c5-4c288bf5f0e9		Gary W. Crews, PLLC	Rachelle	f	t	t	f	f	f	t	f	t	f	f	Tier 3					85	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
86	8f25e0e6-2432-4e4d-86bb-2a0ead0cff54		Genesis Technologies Inc.	Tiffany	t	f	f	f	f	f	f	f	f	f	f						86	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
87	77f40231-6ecd-426f-b45a-979079f31a40		Good Guy's Roofing	Matt	t	f	f	f	f	f	f	f	f	f	f						87	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
88	44fb01c0-8600-481e-9b60-31750f0db3e3		Grace and Peace Presbyterian Church	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					88	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
89	338db01c-bc94-4c25-8f43-ba51736f24f6		Grassroots Essentials	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					89	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
90	b3398163-529c-411e-97e2-94b119ba111f		Green Country Business Solutions	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					90	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
91	9a74e3fc-7933-4b03-94fd-033bc5fa2741		Gunter Training	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					91	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
92	9cdde72d-b31f-48ed-a949-349cee836612		Hagen Enviromental	Matt	f	f	t	t	f	f	f	f	t	f	f	Tier 3					92	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
93	69c59aec-6d6b-4a34-af54-e16dfaabce4e		Harvest Acupuncture	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					93	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
94	75866398-e964-4070-980b-29de76fb75d9		HBI Global Partners	Matt	t	t	t	f	f	f	f	t	f	f	f	Tier 3					94	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
95	85803877-191d-4478-9d01-4614a6ad4b28		Healing Broken Trust	Matt	f	f	t	t	f	f	f	f	f	f	f	Tier 2					95	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
96	ca88da10-fbcc-4096-b852-8c699d879e65		Heritage Waste Management	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1					96	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
97	29d46ee1-8aa0-441a-bca1-775821a3cd9f		High Point Grace Church	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1					97	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
98	e4199afd-e9db-45c7-90a2-f7c296306056		Hillenburg Coffee Company	Rachelle	t	t	f	f	f	f	f	f	f	f	f	Tier 1					98	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
99	5f2b8429-b3b3-47ad-9f98-cc20b49e1065		Holly Mechanical	Tiffany	t	t	f	f	f	f	f	f	f	f	f						99	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
100	ffabf149-cd0a-4c78-be6d-77b67ec8e97b		Home of Grace Ministry, Inc	Elise	t	t	f	f	f	f	f	f	f	f	f	Tier 1					100	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
101	10f59e8f-3d4d-4cb5-8d01-698f78951a13		Honeycomb Company of America, Inc	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					101	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
102	a215e078-ccbb-4fad-ba2f-358d6d9fe40a		Hopper Dental	Matt	t	f	t	f	f	f	f	f	f	f	f	Tier 1					102	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
103	7b6b39a6-72aa-4804-b8fb-bb36c69e9966		Integrity Pools	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					103	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
104	bd398544-e8e5-4478-ab84-9808c8965a7a		Integrity Staffing Solutions	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					104	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
105	445406ad-5b63-41fa-a820-1a642705ce34		ION Sports ☠️	Elise	t	t	f	f	f	f	f	f	f	f	f	Tier 1					105	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
106	73fa895c-70cf-4394-8807-7703bf3905f4		J. Miller Law Firm, PLLC	Rachelle	t	t	t	f	f	f	f	f	f	f	f	Tier 2					106	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
107	c8f91d21-76d0-4206-bca8-0491151034a6		Jared Haley(The Property Center)	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					107	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
108	4a0a47a4-d97c-46ab-b750-982025281a94		Joie de Vie Interiors	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					108	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
109	e2bb037c-b0dd-4c0b-aa16-725d5a4912ca		Jolly Lane Lights	Tiffany	f	f	f	t	t	f	f	f	f	f	f	Tier 2					109	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
110	3a6b231c-45b4-42e0-a405-d3a821f3476d		Kimberly Haar - Author	Tiffany	f	f	t	f	f	f	t	t	f	f	f	Tier 3					110	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
111	83c3f8e4-3e79-4069-bcc7-94bab94d39f2		Kimberly K. Hays, PLLC	Rachelle	t	t	f	f	f	f	f	f	f	f	f	Tier 1					111	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
112	4157fd6b-0b49-4054-9afc-b357e4cf580f		Kwik Dry - Daytona	Matt	t	f	f	t	f	f	f	f	f	f	f	Tier 1					112	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
113	5a010ffd-105a-449d-a671-54395801a36e		Kwik Dry - Evansville	Matt	t	f	f	t	f	f	f	f	f	f	f	Tier 1					113	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
114	f73ffb6e-30fd-407f-9d03-a976c06807f4		Kwik Dry - Gulf Port	Matt	t	f	f	t	f	f	f	f	f	f	f	Tier 1					114	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
115	95ade65f-eb54-4c49-b521-2edc7d35adcc		Kwik Dry - Hampton Roads	Matt	t	f	f	t	f	f	f	f	f	f	f	Tier 1					115	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
116	5b710e1e-be66-426a-9f6b-8c9a9d1eb35f		Kwik Dry - Lehigh Valley	Matt	t	f	f	t	f	f	f	f	f	f	f	Tier 1					116	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
117	5142aa66-c1ee-4211-b3fe-9b7dfec69b17		Kwik Dry - Louisville	Matt	f	f	f	t	f	f	f	f	f	f	f	Tier 1					117	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
118	3f8af905-bff8-4cc3-9d45-72763345e6ae		Kwik Dry - Mufreesboro	Matt	t	f	f	t	f	f	f	f	f	f	f	Tier 1					118	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
119	124b6059-0156-43d4-b847-60967f76b477		Kwik Dry - OC	Matt	f	f	t	t	f	f	f	f	f	f	f						119	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
120	58118214-9050-4e48-bb2d-fc7c2e4ca96a		Kwik Dry - OKC	Matt	t	f	f	t	f	f	f	f	f	f	f	Tier 1					120	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
121	9e153dc7-7cd4-475d-b9da-d727c574b799		Kwik Dry - Palm Beach	Matt	f	f	f	t	f	f	f	f	f	f	f	Tier 1					121	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
122	96111de1-293f-4cc4-a35c-68cf250aeb7f		Kwik Dry - Phoenix	Matt	f	f	f	t	f	f	f	f	f	f	f	Tier 1					122	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
123	e7c830d1-589b-41f3-9ae6-35aef7661791		Kwik Dry - LA	Matt	f	f	f	t	f	f	f	f	f	f	f						123	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
124	7790a04a-65f4-47d8-8592-d20e144b6f7c		Kwik Dry Tulsa	Matt	f	f	f	f	f	f	f	f	f	f	f						124	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
125	ff9ddf10-60fc-4d2d-9919-65d732b6e4d9		Kwik Dry- Central Florida	Matt	f	f	f	t	f	f	f	f	f	f	f	Tier 1					125	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
126	d25c3187-82f5-47df-82ab-e923f2cc2775		Kwik Dry - Rio Grande Valley	Matt	f	f	f	t	f	f	f	f	f	f	f						126	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
127	a1def352-3a28-4db1-a6ee-1bb09af53cd2		L. Eads, LLC	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1					127	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
128	567cdfa4-9b05-4a34-887e-3e507d46aa54		Lamb Homes (same owner as 141)	Tiffany	f	t	f	f	f	f	f	f	f	f	f	Tier 1					128	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
129	768a0d3d-cb75-4423-8405-db18239f3cbe		Lane Publishing/Tulsa Pet (Moved Sites)	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1					129	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
130	a8dddb3f-1d6a-4bab-b00a-cbef134b4932		LDC	Rachelle	f	t	f	f	f	f	t	t	t	f	f	Tier 3				FB Ad	130	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
131	c232f532-74b5-4f52-af2e-03d6c54163ca		Legacy Financial & Consulting	Tiffany	f	f	f	f	f	f	f	f	f	f	f						131	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
132	593f1ca1-1108-478d-8d4f-ea8303d4cf5f		Legalis Connection Hub	Rachelle	t	t	f	f	f	f	f	f	f	f	f	Tier 1					132	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
133	cfe19fc2-8b03-477c-885f-4a96538654e3		Len Mink Ministries	Support	f	t	f	f	f	f	f	f	f	f	f	Tier 1					133	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
134	6a528753-c3ee-43e5-8a7d-ec6333e0b618		LoneStar Vapor Shop, LLC	Tiffany	f	f	t	f	f	f	t	t	f	f	f	Tier 3					134	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
135	f4b44daa-56f3-4910-908f-8cf82ad35f3a		M&D Contracting	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					135	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
136	44fcbf19-e774-49c6-a4b5-2ca01f843aba		Magnolia Family Dental Care	Tiffany	t	t	t	t	f	f	f	t	f	f	f	Tier 3	qtr strategy			building new site	136	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
137	c3df0a9e-f750-4099-8f11-ad2d14e51467		Maplebrook Acupuncture Clinc	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					137	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
138	1c6a3c16-7326-45bc-aa6d-f01deb1d2c34		Mari Coffee and Tea	Rachelle	t	f	f	f	f	f	f	t	f	f	f	Tier 1					138	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
139	47b0fbf9-22fe-491f-9182-57790e151962		Martinez Law	Tiffany	t	t	f	t	f	f	f	f	f	f	t	Tier 3					139	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
140	97b35a8c-ade8-4ff2-a205-18055423d5ab		Mathis Homes	Tiffany	t	t	f	f	f	f	f	f	f	f	f						140	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
141	3331c1dd-7c76-4718-a9b0-ee6167c270f2		MC2 Homes, LLC	Matt	f	f	t	t	f	f	f	t	f	f	f						141	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
142	ae8cc2ad-bea8-4929-95b1-206e1224f47e		McDougall DDS	Matt	t	t	t	f	f	f	f	f	f	f	f	Tier 2					142	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
143	5c94cdd9-bfaf-4cde-9ce9-df5e1e727a44		McWilliams Media	Matt	f	f	t	f	f	f	t	t	t	f	f	Tier 3	everyday				143	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
144	695043ba-1625-4c35-93f5-324ed6bd240e		Monitoring America Alarm Co-Op	Rachelle	t	t	t	t	f	f	f	f	f	f	f	Tier 3					144	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
145	4e53f73c-f69f-4aa6-a53a-1571b3e8e985		Mr Electric	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1					145	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
146	a2711017-64b0-4753-8151-d9fdb684fc12		MS Moving Soulutions	Elise	t	t	f	f	f	f	f	f	f	f	f						146	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
147	24f1b8ac-ab2f-48fa-822b-a90009706bab		Nantz Mower & Small Engine LLC	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1					147	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
148	ac1c1252-dc78-4b04-80c6-4ec97e4a4872		Neurogenesis Brain and Spine	Tiffany	t	f	f	f	f	f	f	f	f	f	f						148	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
149	41bb9382-1b9c-4db4-b6f8-d93084a7387a		Nikki Burgett	Support	t	t	f	f	f	f	f	f	f	f	f	Tier 1					149	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
150	910afe32-e61d-4e8c-ac4a-1448bbf90eb1		Now Someday Adventures	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1					150	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
151	d58287f0-c58a-4615-92e6-a02f89d0dacd		OFSA	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1					151	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
152	7953173f-0d7d-41b5-9974-8c0b0657ab9a		OK Compliance Testing Lab	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					152	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
153	c0dd753d-fb15-4e8a-bc03-9c8916972bf7		Ok Traffic Ticket Defense	Tiffany	t	t	t	t	f	f	f	f	t	f	f	Tier 3					153	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
154	7b7ec277-f334-4590-9fb9-1933e1bcbef8		Okieolier-Jan Collins	Support	t	t	f	f	f	f	f	f	f	f	f	Tier 1					154	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
155	4b7fb1f5-7a74-47cd-b91c-016237afb600		Oklahoma Mortgage Group	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1					155	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
156	b1162247-03c1-4c29-94f2-6bd116200585		Oklahoma Recycling Association	Tiffany	f	t	f	f	f	f	f	f	f	f	f	Tier 1					156	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
157	63af396c-0a33-4de2-96a5-5a24815df871		Oklahome Inspections	Matt	t	t	t	f	f	f	f	f	f	f	f	Tier 2					157	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
158	238ee95e-d88a-4761-a71b-e152a30f38dd		On The Rock	Tiffany	f	t	t	f	f	f	f	f	f	f	f	Tier 2					158	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
159	c5282da2-27df-442d-b564-ef68a822fea6		Oren	Tiffany	f	t	f	f	f	f	f	f	f	f	f	Tier 1					159	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
160	c8894243-3af2-4564-afec-92af3b4ecae7		Pain Management of Oklahoma BA	Matt	t	t	t	t	t	f	f	t	f	f	f	Tier 3					160	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
161	baac9f67-bf26-46f1-9797-a06693675329		Pain Management of Oklahoma Grove	Matt	f	f	t	t	f	f	f	f	f	f	f	Tier 2					161	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
162	fec9c58b-2041-459d-a6b9-f307be41dfdf		Pain Management of Oklahoma Mcalester	Matt	f	f	t	t	f	f	f	f	f	f	f	Tier 2					162	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
163	d167513e-09b3-4691-8f0a-2793260091c2		Pain Management of Oklahoma Sallisaw	Matt	f	f	t	t	f	f	f	f	f	f	f	Tier 2					163	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
164	e4ac2d64-7cc8-430b-89ca-b578adcecac8		Pain Managmet of Oklahome Sand Springs	Matt	f	f	t	t	f	f	f	f	f	f	f	Tier 2					164	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
165	06513305-d75b-42d6-84e8-39797b7b8e57		Petty Family Floors	Tiffany	f	f	f	f	f	f	t	f	f	f	f	Tier 1					165	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
166	4ea286f3-3225-4806-9adc-2dde474d4f7d		Pharma Freedom	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1					166	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
167	3d93c66d-b6dd-49df-8e4a-f3dfff959cbe		Premier Janitorial	Tiffany	f	f	t	t	f	f	f	t	t	f	f	Tier 3					167	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
168	a1c0b372-9a11-4aa2-816b-753fc0a4be7c		Premier Rheum of OK	Tiffany	f	t	f	f	f	f	f	f	f	f	f	Tier 1					168	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
169	24668b38-a345-48eb-b64b-7a1c46f33358		Precision Finishing LLC	Elise	f	f	f	f	t	f	f	f	f	f	f						169	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
170	1e9be9bc-258d-4a17-8bf2-86ba4dab274c		Professional Driven Solutions	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					170	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
171	00a34290-1c52-4966-9322-851ab8555e82		Property Arts Inc	Tiffany	f	f	t	f	f	f	f	f	f	f	f	Tier 1					171	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
172	0d9e9949-6a12-454f-bb04-e20f648cb490		Pryor Creek Dental	Tiffany	f	t	f	f	f	f	f	f	f	f	f	Tier 1					172	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
173	bc743b76-4479-449c-a730-f13171c10479		PSS Enterprises, Inc	Rachelle	f	f	f	t	f	f	f	f	f	f	f	Tier 1					173	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
174	03a53e2a-3459-4b6e-8c3d-ec2ab5392f99		Quilter's Hideaway	Rachelle	t	f	f	f	f	f	t	f	f	f	f	Tier 1					174	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
175	cc650d81-7c8d-47eb-bc12-f1dbcf0cd0c0		Reimagined Health	Matt	f	f	t	f	f	f	f	t	f	f	f	Tier 2					175	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
176	fd1a4e82-7d2c-4dd0-b794-aa7e3b77d819		Renaissance Reatly	Tiffany	f	f	f	f	f	f	f	t	f	f	f	Tier 1					176	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
177	56710e4b-96b5-4042-8a9f-1fcf42ff45c5		Revitalize Osteopractic Physical Therapy	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					177	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
178	4e79e17e-23c2-4aab-9586-b54e8bf727f6		Riverside Heat & Air	Tiffany	f	t	f	f	f	f	f	f	f	f	f	Tier 1					178	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
179	43251e28-c982-4a32-8213-dfeea384e0d5		Roof Sixty-Six Bar	Tiffany	f	f	f	t	f	f	f	f	f	f	f	Tier 1					179	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
180	8ac31699-abda-4675-9540-3ec4405f9d35		Roofs-R-Us (DND)	Rachelle	t	t	f	f	f	f	f	f	f	f	f	Tier 1				Stopping SEO and would like to prorate the first week of June SEO and nothing more if possible. He called 6/7/2022 to cancel and ask for prorated SEO told him Matt was the decision maker and he was out of town AERODGERS	180	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
181	148d65d5-1dac-4223-9ad3-a6367f95490c		Ryan's Manufacturing	Matt	t	f	f	f	f	f	f	f	f	f	f						181	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
182	7964a79d-443c-4a67-90b6-17543237d710		Sam the Concrete Man	Tiffany	f	f	f	f	f	f	f	f	f	f	t	Tier 1				New client as of 4/30	182	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
183	180e621e-6f17-4c39-9d4a-0777fd38d152		Seasons OK, MO	Matt	t	f	t	t	f	f	f	t	f	f	f	Tier 3					183	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
184	b591d149-484f-44ff-ac0d-68a29dbedcce		Semi Crazy Truck Wash	Tiffany	f	t	f	f	f	f	f	f	f	f	f	Tier 1					184	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
185	b6db22ae-87bb-406f-bde1-5b1a7dfe4d6e		siHi Minstries	Rachelle	t	t	f	f	f	f	f	f	f	f	f	Tier 1					185	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
186	58f97add-51b3-4b4e-8e11-46c3f2e47b00		Silver Canyon RV Park	Matt	f	f	t	t	f	f	f	t	f	f	f						186	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
187	f8406190-fdd2-4136-b7df-b6cf4cf7c99a		SJS Hospitality	Tiffany	f	f	t	f	f	f	f	f	f	f	f						187	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
188	0d523bd8-3a6a-47df-85f1-02f0aeb8fb3e		Southern Safe Rooms	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1					188	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
189	9a02497a-bfaa-4ea7-8d3a-f3a85be2922e		Southern Sheet Metal	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1					189	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
190	436b9176-035f-4f19-9f6c-dc0989eb680e		SpecTest LLC	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					190	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
191	14fec418-a18c-4a1c-92d0-ee2c9da40ff7		Spradlin Service Company	Rachelle	f	t	f	t	f	f	f	f	f	f	f	Tier 2					191	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
192	8848e002-6733-4ccf-90da-28478c273ad1		SRC Fixtures	Rachelle	t	t	f	f	f	f	f	f	f	f	f	Tier 1					192	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
193	80f8a646-de86-4c98-a145-52b396231086		Standard Roofing and Contracting	Matt	f	f	t	t	f	t	f	f	f	f	f						193	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
194	e105532c-aacc-408a-96a0-3028302cb237		Starting Strength	Tiffany	f	f	f	t	f	f	t	t	f	f	f	Tier 3					194	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
195	d1dada1c-8397-4040-879a-9680630ce1fa		Step by Step Therapy, Inc.	Tiffany	t	t	f	f	f	f	f	t	f	f	f	Tier 2					195	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
196	76d181e1-408f-43b9-bcf9-43d20e16e82f		Stephen DeCanio	Tiffany	f	t	f	f	f	f	f	f	f	f	f	Tier 1					196	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
197	b7fa4320-3c8c-4e71-ac75-241362d466c1		Stubque	Matt	f	t	t	f	f	f	f	f	f	f	f	Tier 2					197	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
198	5a48153e-8216-4b49-981c-cc42d85ef9c4		SubStruct	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					198	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
199	35e3614e-8fde-4d39-a54b-0dfaf34e9f78		Sundance Office Furniture	Matt	f	t	t	f	f	f	f	f	f	f	f	Tier 2					199	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
200	fdf5eb4a-e4f9-46a0-bae0-00f76002b837		Swineheart Insurance Agency	Matt	f	t	f	f	f	f	f	f	f	f	f	Tier 1					200	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
201	af99429e-10ba-4221-8ffe-4fb05735ddfa		Tellez Heating & Air	Matt	f	f	f	t	f	f	f	f	f	f	f						201	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
202	3bed539b-7a3d-4658-b2b6-074a419f10c7		The Blanchard Law Firm	Rachelle	t	t	t	f	f	f	f	f	t	f	f	Tier 3					202	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
203	315553bf-17b5-4f88-8b5b-504bf2ebd83a		The Connecting Co	Tiffany	t	t	f	f	f	f	f	f	f	f	f						203	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
204	744d73d7-bc1e-46ea-bf5d-2d3bca17a058		The Dental Studio of South Tulsa	Tiffany	t	t	t	f	f	f	f	f	f	f	f	Tier 2					204	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
205	0a4c7c47-68a0-43e8-bd58-a010909796f1		The Office	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					205	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
206	cc7c8f94-1897-4468-92a5-6bc8be5ff2cf		The Poop Fairy	Rachelle	f	t	f	f	f	f	f	f	f	f	f	Tier 1					206	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
207	023a3646-38b2-4056-93c8-dbe8a9b8df58		Thorny Nettles	Matt	t	f	f	f	f	f	f	f	f	f	f						207	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
208	b5999d89-644e-4ddd-8532-92980437f409		Tokyo Garden	Rachelle	t	t	f	f	f	f	f	t	f	f	f	Tier 2					208	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
209	c2eb3a62-e8a4-492f-8d05-c9be2676548f		Tower Business Complex	Rachelle	f	t	f	f	f	f	f	f	f	f	f	Tier 1				Linds	209	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
210	060cf5a7-b645-40dc-afcf-69d4600209a5		Transcend Dental Implants & Perio	Rachelle	f	t	t	t	f	f	f	f	f	f	f	Tier 3					210	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
211	3e97398f-7bc5-4186-9cb1-712fb1c4c325		Truskett Law	Matt	f	t	t	f	f	f	f	t	f	f	f	Tier 2	1/month				211	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
212	a0bee200-5a09-4dc2-9dd9-5e4d00352ee0		Tulsa Elite Meet	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1					212	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
213	46cc09a4-738d-4fff-9cc7-38f08182d215		Tulsa Executive Cleaning	Rachelle	t	t	f	f	f	f	f	f	f	f	f	Tier 1					213	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
214	00c03d12-9762-4a3f-9922-335d3b0f9dc0		Tulsa Gun Club	Tiffany	f	t	f	f	f	f	f	f	f	f	f	Tier 1					214	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
215	53b07423-e878-42e0-94e5-3ed8de49f236		Tulsa Insurance Guy	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					215	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
216	dbed6210-fe02-494f-9df7-695c75f7d087		Tulsa Modern Dental	Matt	f	f	t	f	f	f	f	t	f	f	f						216	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
217	3907283d-9f31-459d-95f0-5be60aa5c861		Tulsa Surveillance Tech	Tiffany	t	t	t	f	f	f	f	f	f	f	f	Tier 1					217	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
218	250518ac-8580-4706-bcc1-dc3c4c51f9ae		Ultimate Cabinets	Tiffany	f	f	t	t	f	f	t	t	f	f	f	Tier 3					218	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
219	7e296cbb-f212-4f99-ae97-20f1038e4ea7		Ultimate project, Inc	Rachelle	t	t	f	f	f	f	f	f	f	f	f	Tier 1					219	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
220	700e9395-9242-497d-b21d-a45bea43a5b6		UpClosets	Tiffany	f	f	f	t	t	f	t	t	f	f	f	Tier 3					220	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
221	8a1e3167-9047-44e5-aa77-610adf0e0e84		Via Sophia Bookkeeping	Tiffany	t	f	t	f	f	f	f	f	f	f	f	Tier 1					221	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
222	47e9c0fb-2d3c-4cd3-8e0d-1ff38512165a		Wagner & Lynch Law Firms	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1					222	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
223	099c79aa-93ec-4c02-8dc9-bed75806fddb		Wagner for House	Matt	t	t	f	f	f	f	f	f	f	f	f	Tier 1					223	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
224	d37626c6-6967-4392-ba49-4a7aa18d1a2d		Watson Tree Academy	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					224	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
225	34325922-da45-4345-a5ad-4d4ee7752787		West Tulsa Tag	Tiffany	t	t	t	f	f	f	f	f	t	f	f	Tier 1					225	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
226	c7a19b1f-12b3-4b67-9ee5-c2e63563cf51		Whipp Law	Tiffany	f	f	f	f	f	f	t	f	f	f	f	Tier 1					226	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
227	d7197666-0936-4447-bd58-3bcdc4e40f24		Whitacre Glass	Rachelle	t	t	f	f	f	f	f	f	f	f	f	Tier 1					227	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
228	5473e363-c650-4b70-b21f-18de1a6ee4ca		Wiemann/IMG (DND)	Support	f	t	f	f	f	f	f	f	f	f	f	Tier 1					228	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
229	5e0c7cf2-c853-4445-8ffc-cf7440144c7b		Willow Landscape & Design	Tiffany	t	t	f	t	f	f	f	f	f	f	f	Tier 2					229	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
230	eb0411c0-1eba-4a11-9684-0a821428557e		Winches Inc	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1					230	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
231	630d2d4e-4555-4d9f-9fa7-5ce4d108118e		Winds of Change	Tiffany	t	t	t	f	f	f	f	t	f	f	f						231	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
232	38e82976-b2f8-44c6-be07-92d70ac329b9		Word of Life Church	Support	t	t	f	f	f	f	f	f	f	f	f	Tier 1					232	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
233	6b9f0b21-a234-427e-a97b-45834eadb810		World Dental Relief	Support	t	t	f	f	f	f	f	f	f	f	f	Tier 1					233	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
234	f0b30e8b-0a22-404a-82b8-82a9ec25f7a6		ZEIDERS LAW GROUP, PLLC	Rachelle	t	t	t	t	f	f	f	f	f	f	f	Tier 2					234	2026-05-08 12:59:29.832944	2026-05-08 12:59:29.832944
1	e533c9c8-e408-4c30-8a8a-3b1ab50a77eb	-	141 Peoria (Pine Ridge website)	Tiffany	t	t	f	f	f	f	f	f	f	f	f	Tier 1	Week of 7/7		July 2026		1	2026-05-08 12:59:29.832944	2026-05-08 14:44:07.173
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, conversation_id, role, content, created_at) FROM stdin;
\.


--
-- Data for Name: monthly_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.monthly_tasks (id, uuid, client_id, project_id, task_type, assigned_to, due_date, status, output_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: onboarding_clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.onboarding_clients (id, uuid, client_name, business_name, client_email, client_strategist, services, proposal_id, contract_id, status, created_at, updated_at) FROM stdin;
2	a4e3e9a4-b669-4f0e-b3b6-c2872732d4bc	Lindsay McWilliams	Finding Easy	lindsaymcwilliams@gmail.com	Matt McWilliams	["website"]	a4e3e9a4-b669-4f0e-b3b6-c2872732d4bc	\N	active	2026-05-05 23:09:24.600885	2026-05-05 23:09:24.600885
\.


--
-- Data for Name: onboarding_form_responses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.onboarding_form_responses (id, uuid, onboarding_client_id, responses, status, submitted_at, created_at, updated_at) FROM stdin;
1	c401403b-6c45-47bb-8188-3cec73106ff0	59ed4c8f-3c41-4985-b048-888f4bd15d32	{"general":{"websiteUrl":"","pocEmail":"","standardDiscounts":"","seasonalDiscounts":"","leadMagnets":"","logoFilesUrl":"","brandImagesUrl":"","facebookUrl":"","instagramUrl":"","linkedinUrl":"","otherSocialUrl":""},"googleAds":{"articlesOfCorpUrl":"","driversLicenseUrl":"","hasGoogleLsa":false,"lsaArticlesOfCorpUrl":"","lsaDriversLicenseUrl":"","lsaBusinessInsuranceUrl":"","lsaLicenseNumber":"","lsaLeadsyLink":"","lsaSetupOption":""},"socialMedia":{"graphicStyles":[],"postTypes":[],"inspirationalAccount1":"","inspirationalAccount2":""},"metaAds":{"hasRunMetaAds":null,"metaBusinessManagerName":"","facebookAdAccountName":"","hasLandingPage":null,"instagramConnected":false,"identityConfirmed":false,"paymentAdded":false,"phoneVerified":false},"email":{"emailContactListUrl":"","hasDoneEmailMarketing":null,"emailPlatform":"","mailchimpAccessGranted":false,"emailListSize":""}}	pending	\N	2026-05-06 03:13:14.834162	2026-05-06 03:13:23.916
\.


--
-- Data for Name: onboarding_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.onboarding_tasks (id, proposal_uuid, label, completed, sort_order, created_at) FROM stdin;
7	a4e3e9a4-b669-4f0e-b3b6-c2872732d4bc	Schedule kickoff call	f	1	2026-05-05 23:09:24.607748
8	a4e3e9a4-b669-4f0e-b3b6-c2872732d4bc	Collect brand assets	f	2	2026-05-05 23:09:24.607748
9	a4e3e9a4-b669-4f0e-b3b6-c2872732d4bc	Set up client portal access	f	3	2026-05-05 23:09:24.607748
10	a4e3e9a4-b669-4f0e-b3b6-c2872732d4bc	Deliver first milestone	f	4	2026-05-05 23:09:24.607748
6	a4e3e9a4-b669-4f0e-b3b6-c2872732d4bc	Send welcome email	f	0	2026-05-05 23:09:24.607748
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, uuid, client_id, type, phase, status, deadline, deliverables, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: proposals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proposals (id, uuid, client_name, business_name, client_email, project_type, status, total_amount, content, special_context, loom_video_url, calendly_url, signature_data, signed_at, view_count, created_at, updated_at, number_of_pages, page_names, client_strategist, notes, last_viewed_at, selected_tier, pricing_items, brand_shoot_enabled, brand_shoot_text, discount_type, discount_value, discount_label) FROM stdin;
21	a584d249-97e2-4244-a00f-4fb08c1878d5	Mike Johnson	Mike's Bikes	matt32mc@gmail.com	web	draft	0.00	\N	\N	\N	\N	\N	\N	0	2026-05-07 03:13:36.989648	2026-05-07 03:13:36.989648	1	Home	Matt McWilliams	\N	\N	\N	\N	t	\N	\N	\N	\N
\.


--
-- Name: agent_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agent_logs_id_seq', 1, false);


--
-- Name: audit_leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_leads_id_seq', 8, true);


--
-- Name: cancellations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cancellations_id_seq', 1, false);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clients_id_seq', 1, false);


--
-- Name: contracts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contracts_id_seq', 10, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.conversations_id_seq', 1, false);


--
-- Name: knowledge_base_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.knowledge_base_id_seq', 1, false);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leads_id_seq', 1, false);


--
-- Name: master_clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.master_clients_id_seq', 234, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: monthly_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.monthly_tasks_id_seq', 1, false);


--
-- Name: onboarding_clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.onboarding_clients_id_seq', 2, true);


--
-- Name: onboarding_form_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.onboarding_form_responses_id_seq', 1, true);


--
-- Name: onboarding_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.onboarding_tasks_id_seq', 10, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.projects_id_seq', 1, false);


--
-- Name: proposals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.proposals_id_seq', 28, true);


--
-- Name: agent_logs agent_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_logs
    ADD CONSTRAINT agent_logs_pkey PRIMARY KEY (id);


--
-- Name: agent_logs agent_logs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_logs
    ADD CONSTRAINT agent_logs_uuid_unique UNIQUE (uuid);


--
-- Name: audit_leads audit_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_leads
    ADD CONSTRAINT audit_leads_pkey PRIMARY KEY (id);


--
-- Name: audit_leads audit_leads_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_leads
    ADD CONSTRAINT audit_leads_uuid_unique UNIQUE (uuid);


--
-- Name: cancellations cancellations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellations
    ADD CONSTRAINT cancellations_pkey PRIMARY KEY (id);


--
-- Name: cancellations cancellations_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellations
    ADD CONSTRAINT cancellations_uuid_unique UNIQUE (uuid);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: clients clients_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_uuid_unique UNIQUE (uuid);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_uuid_unique UNIQUE (uuid);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: knowledge_base knowledge_base_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_pkey PRIMARY KEY (id);


--
-- Name: knowledge_base knowledge_base_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_uuid_unique UNIQUE (uuid);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: leads leads_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_uuid_unique UNIQUE (uuid);


--
-- Name: master_clients master_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_clients
    ADD CONSTRAINT master_clients_pkey PRIMARY KEY (id);


--
-- Name: master_clients master_clients_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_clients
    ADD CONSTRAINT master_clients_uuid_unique UNIQUE (uuid);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: monthly_tasks monthly_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_tasks
    ADD CONSTRAINT monthly_tasks_pkey PRIMARY KEY (id);


--
-- Name: monthly_tasks monthly_tasks_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_tasks
    ADD CONSTRAINT monthly_tasks_uuid_unique UNIQUE (uuid);


--
-- Name: onboarding_clients onboarding_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_clients
    ADD CONSTRAINT onboarding_clients_pkey PRIMARY KEY (id);


--
-- Name: onboarding_clients onboarding_clients_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_clients
    ADD CONSTRAINT onboarding_clients_uuid_unique UNIQUE (uuid);


--
-- Name: onboarding_form_responses onboarding_form_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_form_responses
    ADD CONSTRAINT onboarding_form_responses_pkey PRIMARY KEY (id);


--
-- Name: onboarding_form_responses onboarding_form_responses_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_form_responses
    ADD CONSTRAINT onboarding_form_responses_uuid_unique UNIQUE (uuid);


--
-- Name: onboarding_tasks onboarding_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_tasks
    ADD CONSTRAINT onboarding_tasks_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: projects projects_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_uuid_unique UNIQUE (uuid);


--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- Name: proposals proposals_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_uuid_unique UNIQUE (uuid);


--
-- Name: agent_logs agent_logs_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_logs
    ADD CONSTRAINT agent_logs_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: knowledge_base knowledge_base_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: monthly_tasks monthly_tasks_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_tasks
    ADD CONSTRAINT monthly_tasks_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: monthly_tasks monthly_tasks_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_tasks
    ADD CONSTRAINT monthly_tasks_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: projects projects_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict lPlQve6HG0T2aZWUEbcMLWDjlmEatHL2gqGu0bIpHSrgL6HB25TYYqelqUrqxTp

