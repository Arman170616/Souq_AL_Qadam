from rest_framework.pagination import PageNumberPagination


class FlexiblePageNumberPagination(PageNumberPagination):
    """
    Standard page-number pagination that also respects an optional
    ?page_size=N query parameter (capped at MAX_PAGE_SIZE).
    """
    page_size              = 20
    page_size_query_param  = 'page_size'
    max_page_size          = 500
