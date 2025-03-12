# Mock implementation of marshmallow to handle missing dependency
# This provides the minimal implementation needed for the app to run

class Schema:
    """Mock Schema class"""
    def __init__(self, *args, **kwargs):
        pass

    def load(self, data):
        return data

    def dump(self, obj):
        return obj

class ValidationError(Exception):
    """Mock ValidationError class"""
    def __init__(self, message, *args, **kwargs):
        self.messages = message
        super().__init__(message, *args)

class fields:
    """Mock fields namespace"""
    @staticmethod
    def Field(*args, **kwargs):
        return None

    @staticmethod
    def Str(*args, **kwargs):
        return None

    @staticmethod
    def Int(*args, **kwargs):
        return None

    @staticmethod
    def Float(*args, **kwargs):
        return None

    @staticmethod
    def Bool(*args, **kwargs):
        return None

    @staticmethod
    def List(*args, **kwargs):
        return None

    @staticmethod
    def Dict(*args, **kwargs):
        return None

    @staticmethod
    def Nested(*args, **kwargs):
        return None

class validate:
    """Mock validate namespace"""
    @staticmethod
    def Range(*args, **kwargs):
        return lambda x: x

    @staticmethod
    def Length(*args, **kwargs):
        return lambda x: x

    @staticmethod
    def OneOf(*args, **kwargs):
        return lambda x: x
