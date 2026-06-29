from django.test import TestCase
from rest_framework.exceptions import ValidationError

from apps.notes.serializers import NotePartialSerializer, NoteSerializer


class NoteSerializerValidateTitleTest(TestCase):
    def test_whitespace_only_title_is_invalid(self):
        serializer = NoteSerializer(data={"title": "   ", "body": "B"})

        self.assertFalse(serializer.is_valid())
        self.assertIn("title", serializer.errors)

    def test_validate_title_raises_on_empty_string(self):
        serializer = NoteSerializer()

        with self.assertRaises(ValidationError):
            serializer.validate_title("")

    def test_valid_title_is_stripped(self):
        serializer = NoteSerializer(
            data={"title": "  Hello  ", "body": "B", "category": "school"}
        )

        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["title"], "Hello")

    def test_missing_title_is_invalid(self):
        serializer = NoteSerializer(data={"body": "B"})

        self.assertFalse(serializer.is_valid())
        self.assertIn("title", serializer.errors)

    def test_invalid_category_is_rejected(self):
        serializer = NoteSerializer(
            data={"title": "T", "body": "B", "category": "invalid"}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("category", serializer.errors)


class NotePartialSerializerTest(TestCase):
    def test_empty_body_is_invalid(self):
        serializer = NotePartialSerializer(data={})

        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_single_field_is_valid(self):
        serializer = NotePartialSerializer(data={"title": "New title"})

        self.assertTrue(serializer.is_valid())

    def test_whitespace_title_is_still_validated(self):
        serializer = NotePartialSerializer(data={"title": "   "})

        self.assertFalse(serializer.is_valid())
        self.assertIn("title", serializer.errors)
